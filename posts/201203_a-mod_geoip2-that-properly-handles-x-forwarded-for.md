```json
{
    "date"   : "Sun Apr 22 2012 14:55:42 GMT+1000 (EST)"
  , "title"  : "A mod_geoip2 that properly handles X-Forwarded-For"
  , "base"   : "a-mod_geoip2-that-properly-handles-x-forwarded-for"
  , "author" : "Rod Vagg"
}
```

This is just a short follow-up to my original post on<em> <a title="Wrangling the X-Forwarded-For Header" href="http://rod.vagg.org/2011/07/wrangling-the-x-forwarded-for-header/">Wrangling the X-Forwarded-For Header</a></em> where I promised that one of the things I would follow up with was how to get MaxMind's mod_geoip2 to handle the X-Forwarded-For according to the rule:
<p style="text-align: center;"><strong><em>Always use the leftmost non-private address</em></strong>.</p>
Well, since it's turning out to be such a popular post I thought I'd better get it done to help anyone else out that's searching around for solutions. So, I've put up the code on my GitHub account here:<strong></strong>
<p style="text-align: center;"><strong><a href="https://github.com/rvagg/mod_geoip2_xff">https://github.com/rvagg/mod_geoip2_xff</a></strong></p>
I'm maintaining a <em>maxmind</em> branch that contains the original code from MaxMind and the <em>master</em> contains my changes, so you can see a nice <a href="https://github.com/rvagg/mod_geoip2_xff/compare/maxmind...master">diff</a> of what I've done.

I have to warn that I haven't done any serious C programming for more than 15 years or so, my code probably isn't fantastic, and I'm open to outside contributions from anyone with suggestions. The approach I've taken is to embed the regexes of my previous post into the module and walk through the IP addresses looking for a non-private match.

Since my initial release, based on MaxMind's 1.2.5, they've put out a 1.2.7 which includes the addition of a <em>GeoIPUseLastXForwardedForIP</em> flag. I can imagine what prompted this addition but as I said in my previous post this isn't the way to get the best IP address. As of writing, my current master branch is based on 1.2.7 and has this new flag but because the <em>first_public_ip_in_list</em> is done first it's mostly useless.

If anyone wants to hassle MaxMind on my behalf then feel free, I sent them an email a couple of months ago about this but received no answer.

<strong>**Update 6-July-2012**</strong>: A new release with some changes, details <a href="http://rod.vagg.org/2012/07/mod_geoip2_xff-update/">here</a>.