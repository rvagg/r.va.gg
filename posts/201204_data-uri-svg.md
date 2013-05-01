```json
{
    "date"   : "Wed May 23 2012 15:16:22 GMT+1000 (EST)"
  , "title"  : "Data URI + SVG"
  , "base"   : "data-uri-svg"
  , "author" : "Rod Vagg"
}
```

Data URIs are great when you want to serve small resources that there's no point serving up in a combined sprite. Consider <a href="http://microjs.com">microjs.com</a> which serves up an HTML file plus a single JavaScript file containing the latest data used to build the site. The build logic is in an embedded script, the CSS is also embedded, so it's pretty lean considering what you see and the amount of data displayed. But, notice the 3 icons for each project, 2 GitHub icons and a Twitter icon. They are PNG images, combined as a sprite but to avoid an additional HTTP request to fetch them they are simply embedded in the CSS which is embedded on the page:

```css
.title .stat span {
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhE...
}
```

Easy and quick and fairly well supported across browsers.

But Data URIs can do so much more, including embed SVG!

```xml
url("data:image/svg+xml,<svg viewBox='0 0 40 40' height='25' width='25'
xmlns='http://www.w3.org/2000/svg'><path fill='rgb(91, 183, 91)' d='M2.379,
14.729L5.208,11.899L12.958,19.648L25.877,6.733L28.707,9.561L12.958,25.308Z'
/></svg>")
```

The above will produce a 25px square image but the SVG is drawn in a 40x40 coordinate box, because I'm using a <a href="http://raphaeljs.com/icons/">Raphaël Icon</a> paths (you can try it yourself by replacing the <code>d=''</code> content with the path data you get when you click on any of the icons on the <a href="http://raphaeljs.com/icons/">Raphaël Icons</a> page.)

SVG of course gives you perfectly scalable graphics, embedding in a Data URI in your CSS lets you use them in the same way that you use other CSS images, minus the need to fetch them via an additional HTTP request.

<strong>What's the catch?</strong>

It's the web, of course there's a catch, and of course it involves Internet Explorer!

For a start you don't get SVG support in IE8 and below, which is a bit of a problem right now because IE8 is still very much with us due to the fact that IE9 isn't available for Windows XP users. But there's more than that. IE adheres to the <a href="http://www.ietf.org/rfc/rfc2397.txt">spec</a> more strongly than other browsers in that there are 2 types of encoding for Data URIs, <em>base64</em> and <em>non-base64</em>. If you leave the <code>;base64</code> off your string then most browsers let you get away with anything that doesn't conflict with standard CSS, so basically don't use <code>"</code>, or if you do, escape them with simple <code>\"</code>. What the Data URI spec says is:
<blockquote>...the data (as a sequence of octets) is represented using ASCII encoding for octets inside the range of safe URL characters and using the standard %xx hex encoding of URLs for octets outside that range.</blockquote>
And IE doesn't let you have it any other way. So you either encode your SVG into Base64 or escape it with <code>%xx</code>'s, which kind of loses some of the elegance of SVG in CSS. But at least you'll get IE9+ support.

So here's some examples to <a href="http://jsfiddle.net/rvagg/exULa/">fiddle</a> with. Click through to the CSS tab to see the gory details. The first icon is Base64 encoded, the second icon is URL escaped (<code>%xx</code>), the rest are just plain SVG, so you'll get different results viewing in IE9 vs the rest.

SVG in Data URIs is an elegant solution (and a bit of fun) but only really useful at the moment if you don't need to support IE8 and below.

<strong>Update 17th Sept 2012</strong>

Below in the comments, Ben reports on his (much more rigorous) research into browser support; refer to that if you're serious about using SVG in Data URIs. An interesting result of his work comes from the <a href="https://code.google.com/p/chromium/issues/detail?id=137277">issue</a> he filed with Chromium (I don't know if this is a generic WebKit thing or not but you could easily test if you're interested). It turns out that Chromium/WebKit requires Base64 Data URIs to be multiples of 4 characters, so you just need to pad with <code>==</code>.