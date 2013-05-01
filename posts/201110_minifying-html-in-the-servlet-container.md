```json
{
    "date"   : "Wed Nov 23 2011 15:38:44 GMT+1100 (EST)"
  , "title"  : "Minifying HTML in the Servlet container"
  , "base"   : "minifying-html-in-the-servlet-container"
  , "author" : "Rod Vagg"
}
```

Google's <a title="mod_pagespeed" href="http://code.google.com/speed/page-speed/docs/module.html">mod_pagespeed</a> is great. I've been using it for a while now on <a title="FeedXL Horse Nutrition" href="http://feedxl.com">feedxl.com</a> but the only filter that I actually find really useful is <a href="http://code.google.com/speed/page-speed/docs/filter-whitespace-collapse.html">Collapse Whitespace</a>; the rest of the filters I either already do myself as part of the site build process or I don't want applied. But, I imagine that there are a lot of admins out there that would really benefit from all of the clever things it can do.

Unfortunately it's just an Apache2 module so it's a bit difficult to use the cleverness elsewhere. I recently launched a new service that serves content directly from Apache Tomcat without passing through an Apache2 web server like I would normally do (because there was just no need!). Having got used to the nice whitespace optimisations you can get from mod_pagespeed I decided to implement a simple version of my own for Tomcat. Dynamic content is somewhere that you're better off trying not to optimise your whitespace during generation, leave it for post-processing so your logic can be clear.

So, enter <strong>HTMLMinifyFilter</strong>. It's nowhere near as clever as mod_pagespeed but it'll do for basic needs. The core of it is a regular expression that will remove certain patterns and it's configurable so you decide which patterns to include.

```java
package au.com.xprime.misc.webapp.filter;

import java.io.*;
import java.util.regex.*;
import javax.servlet.*;

public class HTMLMinifyFilter implements Filter {
	private Pattern regex = null;

	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
		HttpServletResponse response = (HttpServletResponse) res;
		ResponseWrapper wrapper = new ResponseWrapper(response);
		chain.doFilter(req, wrapper);
		String html = wrapper.toString();
		if (regex != null && response.getContentType() != null && response.getContentType().startsWith("text/html"))
			html = regex.matcher(html).replaceAll("");
		response.setContentLength(html.getBytes().length);
		PrintWriter out = response.getWriter();
		out.write(html);
		out.close();
	}

	public void destroy() {
	}

	public void init(FilterConfig config) throws ServletException {
		StringBuffer pattern = new StringBuffer();
		appendIf(config, "strip-linestart-whitespace", pattern, "(?<=^)[ \\t]+");
		appendIf(config, "strip-lineend-whitespace", pattern, "[ \\t]+(?:$)");
		appendIf(config, "strip-multiple-whitespace", pattern, "([ \\t](?:[ \\t]))+");
		appendIf(config, "strip-blank-lines", pattern, "(\\n[ \\t]*(?:\\n))+");
		if (pattern.length() != 0)
			regex = Pattern.compile(pattern.toString(), Pattern.MULTILINE);
	}

	private void appendIf(FilterConfig config, String configKey, StringBuffer pattern, String s) {
		if (config.getInitParameter(configKey) != null && config.getInitParameter(configKey).equals("true")) {
			if (pattern.length() != 0)
				pattern.append('|');
			pattern.append(s);
		}
	}

	static class ResponseWrapper extends HttpServletResponseWrapper {
		private CharArrayWriter output;

		public ResponseWrapper(HttpServletResponse response) {
			super(response);
			this.output = new CharArrayWriter();
		}

		public String toString() {
			return output.toString();
		}

		public PrintWriter getWriter() {
			return new PrintWriter(output);
		}
	}
}
```

<h3>How does it work?</h3>
We start off by wrapping our response in an object that will supply a CharArrayWriter so we can capture and process whatever the rest of the stack is doing (credit for this idea goes <a href="http://stackoverflow.com/questions/5009650/where-can-i-find-a-java-servlet-filter-that-applies-regex-to-the-output">here</a>). We can then process the output with our regular expression(s) and pass it to the real response.

Before I explain what the regular expressions do I want to caution that this won't be satisfactory in certain situations. It's not aware of &lt;script&gt;, &lt;pre&gt; or any other content where whitespace may be important, so unless you're sure stripping whitespace doesn't matter you may want to find a more intelligent solution.

I've split the regex up into 4 optional parts, you turn them on with init-parameters (explained later), matches of each of these are replaced with an empty string:
<h4><strong>strip-linestart-whitespace - (?&lt;=^)[ \\t]+</strong></h4>
This regex will match whitespace at the beginning of any line. You'll notice that I'm not using \s for my whitespace match, this is because with multi-line pattern matching it'll also match \n and \r which we want to handle separately. The (?&lt;=^) at the beginning is a non-capturing positive look-behind for <em>line-start</em>; so it'll match the start of the line but won't include it in our returned match-group so we only strip out the whitespace.

This option is likely to make the biggest impact on HTML minification on dynamic content because we love to use indentation to define structure.
<h4><strong></strong>strip-lineend-whitespace - [ \\t]+(?:$)</h4>
Same deal as the linestart regex but this time we have (?:$), a non-capturing positive look-ahead for <em>line end</em>.

This will pick up any sloppyness in your HTML (I wish I could do this in Microsoft Word when I have to edit other people's documents, you can't see it, <strong>but it's still there</strong>!).
<h4>strip-multiple-whitespace - ([ \\t](?:[ \\t]))+</h4>
Here we have a group of one or more whitespace characters followed by another whitespace character, non-captured, so we don't strip out all whitespace, remember that we are replacing matches with an empty string so we need the non-capturing second space to leave one intact.

This is probably going to be the most dangerous if you might have content where whitespace is important, e.g. &lt;script&gt;, &lt;pre&gt;.l
<h4>strip-blank-lines - (\\n[ \\t]*(?:\\n))+</h4>
This is very similar to the multiple-whitespace regex but we match a newline, followed by zero or more whitespace characters, followed by a non-captured newline, all repeated one or more times. So we'll get rid of any lines that don't contain content.
<h3>Configuration</h3>
You simply put the filter into your classpath somewhere and wire it up in web.xml. You first define the filter reference and any parameters:

```xml
<filter>
	<filter-name>htmlMinifyFilter</filter-name>
	<filter-class>au.com.xprime.misc.webapp.filter.HTMLMinifyFilter</filter-class>
	<init-param>
		<param-name>strip-linestart-whitespace</param-name>
		<param-value>true</param-value>
	</init-param>
	<init-param>
		<param-name>strip-lineend-whitespace</param-name>
		<param-value>true</param-value>
	</init-param>
	<init-param>
		<param-name>strip-multiple-whitespace</param-name>
		<param-value>true</param-value>
	</init-param>
	<init-param>
		<param-name>strip-blank-lines</param-name>
		<param-value>true</param-value>
	</init-param>
</filter>
```

Any of the parameters can be set to <i>false</i> or omitted all together to turn it off.

Then you need to wire up the filter to any incoming URIs which is done just like servlet-mapping (but still hopelessly unhelpful, why can't we have proper regular expressions for these??). You'll notice that I'm only using a Writer so even though it checks for a text/html response before it does any rewriting you won't want it touching any binary data because we don't wrap getOutputStream(). So, either make sure the filter only gets applied to text/html URIs or modify the filter to be binary-safe. I only have a few URIs that I want to apply this to so I've put them in manually with one of these per URI:

```xml
<filter-mapping>
	<filter-name>htmlMinifyFilter</filter-name>
	<url-pattern>/myuri</url-pattern>
</filter-mapping>
```

But you can also do the simple url-pattern matching with *.ext or /*, etc.

And there you go! Cheap and easy HTML minification from within the Servlet container.