```json
{
    "date"   : "Fri Jul 06 2012 12:47:17 GMT+1000 (EST)"
  , "title"  : "mod_geoip2_xff update"
  , "base"   : "mod_geoip2_xff-update"
  , "author" : "Rod Vagg"
}
```

Thanks to a contribution from <a href="https://plus.google.com/105599514712357912650/posts">Kevin Gaudin</a>, I have a new release of my <a href="http://www.maxmind.com/app/mod_geoip">mod_geoip2</a> fork. (The history starts <a href="http://rod.vagg.org/2012/04/a-mod_geoip2-that-properly-handles-x-forwarded-for/">here</a>.)

You can find the source here: <a href="https://github.com/rvagg/mod_geoip2_xff">https://github.com/rvagg/mod_geoip2_xff</a>

Kevin's addition provides a fall-back to the standard remote IP address of the client if no public IP address is found in the <em>X-Forwarded-For</em> header. Previously, my implementation just fell back to the default mod_geoip2 behaviour of just taking the first IP address in the <em>X-Forwarded-For</em> header, or the last if you set <em>GeoIPUseLastXForwardedForIP</em> in your config.

I also took the opportunity to clean things up a little and introduce a config option to turn on the special <em>X-Forwarded-For</em> handling. You now have to set <strong>GeoIPUseLeftPublicXForwardedForIP</strong> to <strong>On</strong> to activate it.

Thanks to Kevin, and additional contributions are welcome!

<strong>Update July 7th 2012</strong>: Since I was in C-mode, I went ahead and implemented something I've tried to get working in the past: <strong>hostname lookups on the X-Forwarded-For host!</strong> I got intimate with APR and worked out how to use Apache to do the resolution so there isn't the lengthy timeout of raw syscalls. If you set <strong>GeoIPEnableHostnameLookups</strong> to <strong>On</strong>, you'll get a <strong>GEOIP_HOST</strong> environment variable to use.

I've also decided to start making tarballs available off GitHub for your convenience: <a href="https://github.com/rvagg/mod_geoip2_xff/downloads">https://github.com/rvagg/mod_geoip2_xff/downloads</a>