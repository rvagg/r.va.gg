```json
{
    "date"   : "Sat Jul 30 2011 14:49:50 GMT+1000 (EST)"
  , "title"  : "Handling X-Forwarded-For in Java and Tomcat"
  , "base"   : "handling-x-forwarded-for-in-java-and-tomcat"
  , "author" : "Rod Vagg"
}
```

This is the first follow-up to my <a title="Wrangling the X-Forwarded-For Header" href="http://rod.vagg.org/2011/07/wrangling-the-x-forwarded-for-header/">post on X-Forwarded-For</a>, I'll assume you've at least scanned that article.
<h3>Revision of the security issues</h3>
It's important to recap the security message of my previous post. <strong>Don't assume that the content of the X-Forwarded-For header is either correct or syntactically valid</strong>. The header is not hard to spoof and there are only certain situations where you may be able to trust parts of the content of the header.

So, my simple advice is not to use this header for anything <em>important</em>. Don't use it for authentication purposes or anything else that has security implications. It really should only be used for your own information purposes or to provide customised content for the user where it's OK to be basing that customisation on false information, because this will be a possibility.

We use it on <a href="http://feedxl.com/">FeedXL</a> for IP address geolocation using <a href="http://www.maxmind.com/app/country">GeoIP</a> to serve country specific information to visitors. Ultimately it doesn't really matter a whole lot if we get it wrong; while there are differences in the content the differences aren't major. It may cause some confusion but that confusion can be resolved if the customer wants to contact us. You sign up to FeedXL based on your country but we still let you select your country from a list even though we pre-select the one we guess from your IP address. And if you sign up to the wrong country then you won't get access to the correct database for your country; hardly a major security issue, more of an inconvenience. If you're spoofing X-Forwarded-For then you're probably not the kind of person who's going to get confused at the content, you're probably just poking around and are not really interested in our product anyway!
<h3>Extracting a useful IP address</h3>
I ended my last post with a generalised rule for extracting the most likely useful IP address from the X-Forwarded-For header:
<blockquote><strong><em>Always use the leftmost non-private address</em></strong>.</blockquote>
And I gave a couple of regular expressions to help with this process: <code>([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})</code> or<code> (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})</code> to match an IP address. And <code>(^127\.0\.0\.1)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)</code>. To match a private IP address.
<h3>Java use cases</h3>
In my Java code I have 2 uses for the IP address from X-Forwarded-For, both of these come up because we're working behind a load balancer (Amazon's <a href="http://aws.amazon.com/elasticloadbalancing/">Elastic Load Balancing</a>) and don't have direct access to the remote host information:
<ul>
	<li>Looking up the country information in the GeoIP database using their Java API. Most of our use of GeoIP is with <a href="http://geolite.maxmind.com/download/geoip/api/mod_geoip2/">mod_geoip</a> in <a href="http://httpd.apache.org/">Apache </a>but we also want to occasionally use it from within a <a href="http://www.oracle.com/technetwork/java/javaee/servlet/index.html">servlet</a>. For example, on our sign-up page we pre-select the country at the top of the page based on your IP address, this is done within Java.</li>
	<li>More interesting logging from <a href="http://tomcat.apache.org/">Tomcat</a>: if I want to have <a href="http://tomcat.apache.org/tomcat-6.0-doc/config/valve.html#Access_Log_Valve">AccessLogValve</a> turned on, the host information isn't very interesting behind a load balancer.</li>
</ul>
A generic parser would serve both of these purposes!
<h3>Parsing X-Forwarded-For</h3>
I have created a simple utility class to do the parsing, called from wherever I need either an <strong>IP address</strong> or a <strong>hostname</strong>.

```java
package au.com.xprime.webapp.util;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;

public class InetAddressUtil {
	private static final String IP_ADDRESS_REGEX = "([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})";
	private static final String PRIVATE_IP_ADDRESS_REGEX = "(^127\\.0\\.0\\.1)|(^10\\.)|(^172\\.1[6-9]\\.)|(^172\\.2[0-9]\\.)|(^172\\.3[0-1]\\.)|(^192\\.168\\.)";
	private static Pattern IP_ADDRESS_PATTERN = null;
	private static Pattern PRIVATE_IP_ADDRESS_PATTERN = null;

	private static String findNonPrivateIpAddress(String s) {
		if (IP_ADDRESS_PATTERN == null) {
			IP_ADDRESS_PATTERN = Pattern.compile(IP_ADDRESS_REGEX);
			PRIVATE_IP_ADDRESS_PATTERN = Pattern.compile(PRIVATE_IP_ADDRESS_REGEX);
		}
		Matcher matcher = IP_ADDRESS_PATTERN.matcher(s);
		while (matcher.find()) {
			if (!PRIVATE_IP_ADDRESS_PATTERN.matcher(matcher.group(0)).find())
				return matcher.group(0);
			matcher.region(matcher.end(), s.length());
		}
		return null;
	}

	public static String getAddressFromRequest(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && (forwardedFor = findNonPrivateIpAddress(forwardedFor)) != null)
			return forwardedFor;
		return request.getRemoteAddr();
	}

	public static String getHostnameFromRequest(HttpServletRequest request) {
		String addr = getAddressFromRequest(request);
		try {
			return Inet4Address.getByName(addr).getHostName();
		} catch (Exception e) {
		}
		return addr;
	}

	public static InetAddress getInet4AddressFromRequest(HttpServletRequest request) throws UnknownHostException {
		return Inet4Address.getByName(getAddressFromRequest(request));
	}
}
```

<em>(Download <a href="http://src.vagg.org/java/InetAddressUtil.java">here</a>)</em>

Given an <code>HttpServletRequest</code> we can call either <code>getAddressFromRequest()</code> or <code>getHostnameFromRequest()</code> to get the data we need.

We first use the general IP address regular expression and on line 23 we loop through each match we find, starting from the left of the beginning of the string. This way we don't even look at the commas in the string and don't care if there are any spaces or not. We also get to avoid any nonsense data that may be in the string. If you spoof the header with a random string of characters then it'll be ignored. The code is quite strict in that it'll only bother with non-private IP addresses in the header, otherwise it will resort to the remote address of the request as a fall-back.

Our hostname resolution is also prepared for failure and will return the original IP address if it can't get you a hostname.

Instead of just calling <code>request.getRemoteAddr()</code> and <code>request.getRemoteHost()</code> from our own code, you'd simply wrap them in <code>InetAddressUtil.getAddressFromRequest(request)</code> and <code>InetAddressUtil.getHostnameFromRequest(request)</code>.
<h3>Extending Tomcat logging</h3>
You enable request logging in Tomcat by attaching an AccessLogValve to your context or host. It mirrors the custom formatting options that you'll find in <a href="http://httpd.apache.org/docs/2.0/mod/mod_log_config.html">Apache's CustomLog</a>. So, you can print out a <strong>%h</strong> for the request hostname but behind a load balancer you'll just get the name or address of the load balancer that's forwarding the request. You could also just use <strong>%{X-Forwarded-For}i</strong> to get access to the raw header value, but this will either just be an IP address or a comma separated string of IP addresses. This may be useful for your purposes but not mine, I want a hostname!

Unfortunately, AccessLogValve doesn't lend itself to easy extension, there are two <code>createAccessLogElement()</code> methods that you'd ideally be able to overwrite in your own subclass and return a new custom <code>AccessLogElement</code> for the character you've chosen to represent your log element.

The best we can do is overwrite the protected <code>createLogElements</code> and copy the functionality from there and extend with our own. However, in my extension of AccessLogValve I've assumed that the Tomcat boys will eventually <a href="https://issues.apache.org/bugzilla/show_bug.cgi?id=51588">fix</a> the access modifiers for the <code>createLogElement()</code> methods so I've just copied the whole class, named it <code>AccessLogValve_</code> and changed the modifiers myself. The plan being to remove this in the future and take the _ of the extended class name in my code.

Here's my extended AccessLogValve

```java
package au.com.xprime.catalina.valves;

import java.util.Date;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import au.com.xprime.webapp.util.InetAddressUtil;

public class AccessLogValve extends org.apache.catalina.valves.AccessLogValve_ {
	protected class ForwardedForAddrElement implements AccessLogElement {
		public void addElement(StringBuffer buf, Date date, Request request, Response response, long time) {
			buf.append(InetAddressUtil.getAddressFromRequest(request));
		}
	}
	protected class ForwardedForHostElement extends ForwardedForAddrElement {
		public void addElement(StringBuffer buf, Date date, Request request, Response response, long time) {
			buf.append(InetAddressUtil.getHostnameFromRequest(request));
		}
	}

	protected AccessLogElement createAccessLogElement(char pattern) {
		AccessLogElement accessLogElement = super.createAccessLogElement(pattern);
		if (accessLogElement instanceof StringElement) {
			switch (pattern) {
				case 'f' :
					return new ForwardedForAddrElement();
				case 'F' :
					return new ForwardedForHostElement();
			}
		}
		return accessLogElement;
	}
}
```

<em>(Download <a href="http://src.vagg.org/java/AccessLogValve.java">here</a> and AccessLogValve_ <a href="http://src.vagg.org/java/AccessLogValve_.java">here</a>)</em>

Which gives me <strong>%f</strong> for the X-Forwarded-For IP address and %F for the X-Forwarded-For address. My valve pattern looks like this:

<code style="padding-left: 30px;">pattern="%F %f %h %l %u %t %r&quot; %s %b &quot;%{Referer}i&quot; &quot;%{User-Agent}i&quot;"</code>

Simply compile, place together in a JAR, put it in your Tomcat lib directory then make sure you use the right class name when building your AccessLogValve descriptor. The lazy can find a JAR (including source) <a href="http://src.vagg.org/java/xprime_accesslogvalve.jar">here</a>.

Next I'll be getting dirty with C and hack mod_geoip to do something similar.