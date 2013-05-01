```json
{
    "date"   : "Fri Jul 29 2011 16:15:36 GMT+1000 (EST)"
  , "title"  : "Wrangling the X-Forwarded-For Header"
  , "base"   : "wrangling-the-x-forwarded-for-header"
  , "author" : "Rod Vagg"
}
```

Until recently, we've served pages directly from the server for <a title="FeedXL D. I. Y. Horse Nutrition" href="http://feedxl.com/">FeedXL.com</a> but we've since moved to a load balancing situation with multiple servers behind a load balancer.
<h3><strong>AWS &amp; ELB</strong></h3>
We use <a title="Amazon Web Services" href="http://aws.amazon.com">Amazon Web Services</a> to host FeedXL and are now using their <strong><a title="AWS Elastic Load Balancing" href="http://aws.amazon.com/elasticloadbalancing/">Elastic Load Balancing</a> (ELB)</strong> service to spread the load across 3 <em>Availability Zones</em> in the main datacentre we operate from. We're doing this primarily for high availability purposes rather than to handle heavy load but the added benefit is that it lets us scale up really easily if we have any sudden spikes in our traffic. We're using some small instances at the front using <a href="http://httpd.apache.org/">Apache</a> to handle the main traffic. The dynamic content is passed on to larger back-end instances running our webapp in <a href="http://tomcat.apache.org/">Tomcat</a>.

A couple of our important <a href="http://aws.amazon.com/ebs/">EBS</a> volumes were among the last to be restored during <a href="http://alestic.com/2011/04/ec2-outage">Judgement Day</a>, April 2011 and while we had regular snapshots we hesitated for too long before rebuilding our service in a different Availability Zone (or Region), partly because of lack of clear information about the outage from Amazon (we were continually given the impression that it wouldn't be long before things were back online, so why not wait just a tiny bit longer to restore to normal service than restore from slightly older snapshots?). Probably like many AWS customers impacted by the outage, we've increased our spend to boost our redundancy to better handler outages of this kind. We now span multiple Availability Zones and have increased the quality of our off-Region backups. I'm pretty sure that in the end Amazon has ended up doing very well from their rather embarrassing incident with many customers keen to avoid their own embarrassment the next time it happens.

However, switching to ELB hasn't been without hiccups.
<h3>GeoIP</h3>
We rely very heavily on <a href="http://www.maxmind.com/app/country">GeoIP</a> from MaxMind to serve content customised to each country. We have a large amount of functionality built right in to our Apache configuration that uses both <a href="http://httpd.apache.org/docs/2.0/mod/mod_rewrite.html">rewrites</a> and <a href="http://httpd.apache.org/docs/2.0/mod/mod_include.html">SSI</a> to make our static content relatively dynamic. We even do spelling correction for UK/US English depending on where you view our site from! The main reason we customise content though is because FeedXL is a different product for each country. We have to maintain country specific feeds databases and we also mostly deal with local currencies so our price details change a little depending on where you are. We've had a very good experience with GeoIP with only a few mismatches reported by customers and they've always been corporate networks where traffic is routed internationally (Australia-&gt;USA or NZ-&gt;AU for example) or satellite connections without a likely country of origin.

The way that <a href="http://geolite.maxmind.com/download/geoip/api/mod_geoip2/">mod_geoip</a> for Apache works is that it takes the request IP address and looks it up in its database to find the (most likely) country of origin, you then get environment variables in your Apache request: GEOIP_COUNTRY_CODE &amp; GEOIP_COUNTRY_NAME. You can use these with mod_rewrite to do all sorts of crazy things, plus mod_include lets you do more straightforward things with your content. For example, if we want to make a North America specific announcement we might wrap our announcement block in <code>&lt;!--#if expr='"$GEOIP_COUNTRY_CODE" = "US" || "$GEOIP_COUNTRY_CODE" = "CA"' --&gt; <em>... content ... </em>&lt;!--#endif --&gt;</code>.

However, one of the most important catches of load balancing is that your requests come to your web server from the load balancer itself and not the original client, so you don't get the raw IP address of the client built into your request. Instead, with ELB and most other load balancers you need to use the <a href="http://en.wikipedia.org/wiki/X-Forwarded-For"><strong>X-Forwarded-For</strong> </a>HTTP header.
<h3>X-Forwarded-For</h3>
The X-Forwarded-For header was first introduced by <a href="http://www.squid-cache.org/">Squid</a> as a means of passing on the IP address of the client to the server. It has since been widely adopted by other proxy servers and load balancers so it's pretty much considered a <em>standard</em> even if it technically isn't.

What you are supposed to get as your header is this:

```
X-Forwarded-For: clientIP, server1IP, server2IP, server3IP
```

The client IP address should be first, followed by first proxy server, followed by any other servers in a comma separated list. The final server that passes the request on to you won't be in the list, <span style="text-decoration: underline;">a proxy server or load balancer will only append the address of server it received the request from if the X-Forwarded-For header was passed to it</span> otherwise it just constructs a new X-Forwarded-For with just the client address in it. The address of the last server in the complete <em>chain</em> is simply the address of the client making the request to your server. But as usual in the web world there are no guarantees.

Apache kindly gives you an HTTP_X_FORWARDED_FOR environment variable (although I can't find official documentation on this so I'm not sure of the specifics of what conditions may prevent you from getting this variable). You could use this in custom modules or standard modules that use environment variables such as mod_rewrite. If you want to log with it then you could configure your <code>LogFormat</code> to print it out with <code>%{X-Forwarded-For}i</code> to make your logs more interesting than just showing the load balancer hostname as <code>%h</code>.

mod_geoip has a configuration switch, <code>GeoIPScanProxyHeaders On</code> that tells it to use X-Forwarded-For (or HTTP_X_FORWARDED_FOR) to determine the client IP address rather than just the remote address.

There are some important catches to consider before you proceed to use this header to do anything interesting:
<ol>
	<li>Most importantly, headers can be crafted by anyone, <strong>never trust a header value unless you are certain that it can't be spoofed</strong>. I'd actually just simplify that to just <em>never trust a header value</em>. So if you are going to use it then don't use it for anything that has security implications.</li>
	<li>The client IP address that you get from the first entry may not actually be the address that you want. Most of the time the requests will probably come directly from the browser of your visitor but what if they are behind a proxy server within a private network themselves? The IP address you may end up with could be something like 10.1.34.121 which is of no value because it only tells you that they are sitting on a private network <em>somewhere</em> in the world.</li>
</ol>
<h3>Security Implications</h3>
This is pretty straightforward. If you're in the situation of handling traffic behind a load balancer then you may be able to guarantee that your traffic comes from the load balancer so the header is constructed by it, but consider the situation where X-Forwarded-For contains a chain of addresses, potentially from untrusted sources. If the header contains at least one <em>server</em> IP address then the <em>client</em> IP address will have been passed on by the upstream server with no way for your load balancer to verify its correctness; all it's doing is adding the address of the requesting host onto the end of the list.

There's also the possibility of direct connections to your web server(s). Are your servers walled off from the outside world with only the load balancer able to communicate with it? Is there a possibility that a client can make a direct connection to your server and construct its own X-Forwarded-For header? On AWS, all standard instances have a public IP address but you can set up your <a href="http://docs.amazonwebservices.com/AWSEC2/2007-08-29/DeveloperGuide/distributed-firewall-concepts.html">security groups </a>to only allow access to port 80 from your load balancer. This is probably a good idea for many reasons.

Basically, I would suggest working on the assumption that X-Forwarded-For is only <em>likely</em> to be correct, nothing more.
<h3>Best Guess IP Address</h3>
When using X-Forwarded-For, the assumption normally made is that the first IP address in the list is the client address that you can use to do interesting things with, like IP address geolocation (à la GeoIP). But what about <a href="http://en.wikipedia.org/wiki/Private_network">private addresses</a>? What about the casual browser at McDonalds using their WiFi with a 10.x.x.x address or a company network with a 192.168.x.x internal address structure? You'll end up with a very unhelpful address that'll tell you nothing very interesting about the client.

There are 3 sets of address ranges in <a href="http://en.wikipedia.org/wiki/IPv4">IPv4</a> (lets ignore <a href="http://en.wikipedia.org/wiki/IPv6">IPv6</a> for now) that are reserved for private networks. Normally these are hidden behind <a href="http://en.wikipedia.org/wiki/Network_address_translation">NAT</a> gateways and often traffic is forced to either manually or automatically route through a proxy server of some kind. The address ranges are:
<ul>
	<li>10.0.0.0 – 10.255.255.255</li>
	<li>172.16.0.0 – 172.31.255.255</li>
	<li>192.168.0.0 – 192.168.255.255</li>
</ul>
You can thank these beauties for extending the life of IPv4 way beyond what it would otherwise have been.

If you have a client behind one of these networks and it's not routed through a proxy server then you'll probably just get the IP address of the NAT gateway which is likely to be the address you want to use. If the request is routed through a proxy server then you may get an X-Forwarded-For that looks something like this:

```
X-Forwarded-For: 10.208.4.38, 58.163.175.187
```

Where the address you probably want is actually the (proxy) server address on the end rather than the private client address.

You may also have a chain of multiple servers, perhaps you have a downstream proxy server going through a larger upstream one before heading out of the network, so you may get something like this:

```
X-Forwarded-For: 10.208.4.38, 58.163.1.4, 58.163.175.187
```

Or, the downstream proxy server could be within the private network, perhaps a departmental proxy server connecting to a company-wide proxy server and then this may happen:

```
X-Forwarded-For: 10.208.4.38, 10.10.300.23, 58.163.175.187
```

This could of course be even more complex as you may have a longer chain of proxy servers (although I've never actually seen anyone chain more than 2 layers of proxy servers together in a network before).

So what general rule should we construct for extracting our usable client IP from these addresses?

Of course, I'm suggesting that the rule: <strong><em>always use the leftmost address</em></strong> is not correct as there is a good chance it may be a private IP address if there is more than 1 address in the list. Unfortunately this is the rule that mod_geoip adopts, if it finds a comma it just chops off the string at that comma. We immediately found this led to unsatisfactory results with ELB as we had more requests than we expected originating from private networks routed through proxy servers; and we heard about it in the form of error reports from our users (<em>"where's the log in link?"</em>--it's not normally displayed in countries where we haven't released FeedXL).

An alternative would be <strong><em>always use the rightmost address</em></strong> which would probably get you a pretty good guess in almost all cases. If there is more than one IP address in the list then the rightmost address will probably be the address where the request left whatever corporate or internal network the client was hidden behind, even if there are multiple layers. However, multiple layers of IP addresses suggests a fairly large network, possibly widely disbursed. There's also a chance that you have one proxy server piggybacking off a higher capacity upstream proxy server: for example, some ISPs run their own very large proxy servers that customers can use and may make ideal upstream connections for internal proxy servers with caching at both levels. The ISP proxy server is likely to be located in a very different place to the client though and if you're trying to pin down the IP address of the client using something like <a href="http://www.maxmind.com/app/city">GeoIP City</a> then you'll probably get the wrong city.

So, here's the rule that I suggest would be the best general case rule to allow you to extract the address most likely to be physically close to the real client:
<p style="padding-left: 30px;"><strong><em>Always use the leftmost <span style="text-decoration: underline;">non-private</span> address</em></strong>.</p>
We can do this because the rules are clear about what is and what is not a private IP address (see above).
<h3>Doing It the Regular Expression Way</h3>
First, remember that the X-Forwarded-For header is not very trustworthy. You don't want to even assume that it contains IP addresses! So, before you even check if an entry is a private IP address or not you should probably simply check if it's an IP address.

Here's a simple regular expression to match an IP address: <code>([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})</code> or alternatively, if you're working in an environment that supports \d then this will do the same thing: <code>(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})</code> (with or without the parentheses but as you'll see, they are useful for the next step).

Then you'll want to check if an IP address is private or not, here's a regular expression that'll do that for you, given a valid IP address: <code>(^127\.0\.0\.1)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)</code>. This matches all of the addresses matched in the ranges above and 127.0.0.1 as a bonus (quite possible in our chain!).

So a general algorithm could be something like this: walk through the string starting from the first match of our general IP address regular expression through to the last. For each match, check if the matched component matches our private IP address regular expression, if it does then proceed to the next address in the list, if it doesn't match then we have the IP address we want. If we get to the end of the list without finding an IP address that isn't private then we have to have some kind of generic fall-back.

Exactly what your fall-back might be depends on your environment and whether your trust the server passing you the request or not. In the case of ELB, if it's working properly we should never need the fall-back case. For FeedXL our fall-back for any failure during the GeoIP process is to just assume that they are coming from the country where most of our customers are from (currently Australia).

I have 2 follow-up posts to make after this one, first I'll show how I deal with X-Forwarded-For in both Tomcat and our own Java software, then I'll show how I've hacked mod_geoip to use the algorithm outlined above with excellent results.

<em><strong>Follow-up #1: <a title="Permanent Link to Handling X-Forwarded-For in Java and Tomcat" href="http://rod.vagg.org/2011/07/handling-x-forwarded-for-in-java-and-tomcat/" rel="bookmark">Handling X-Forwarded-For in Java and Tomcat</a></strong></em>

<strong><em>Follow-up #2: <a title="A mod_geoip2 that properly handles X-Forwarded-For" href="http://rod.vagg.org/2012/04/a-mod_geoip2-that-properly-handles-x-forwarded-for/"><strong><em>A mod_geoip2 that properly handles X-Forwarded-For</em></strong></a>
</em></strong>
<h3>Update July 30th 2011</h3>
I've just stumbled upon <a title="X-Forwarded-For Spoofer" href="https://addons.mozilla.org/en-US/firefox/addon/x-forwarded-for-spoofer/">this</a>, an "X-Forwarded-For Spoofer" Add-On for Firefox and I love the description, sums up the security concerns:
<blockquote><em>Some clients add X-Forwarded-For to HTTP requests in an attempt to help servers identify the originating IP address of a request. Some clients, however, can set X-Forwarded-For to any arbitrary value. Some servers assume X-Forwarded-For is unassailable. No server should.</em>

<em>With this add-on, you can assign an arbitrary IP address to the X-Forwarded-For field, attempt to perform XSS by including HTML in this field, or even attempt SQL injection.</em></blockquote>
May be useful for testing and debugging your web application.