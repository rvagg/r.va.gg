```json
{
    "date"   : "Fri Apr 20 2012 16:10:16 GMT+1000 (EST)"
  , "title"  : "JavaScript and Semicolons"
  , "base"   : "javascript-and-semicolons"
  , "author" : "Rod Vagg"
}
```

In syntax terms, JavaScript is in the broad C-family of languages. The C-family is diverse and includes languages such as C (obviously), C++, Objective-C, Perl, Java, C# and the newer Go from Google and Rust from Mozilla. Common themes in these languages include:
<ul>
	<li>The use of curly braces to surround blocks.</li>
	<li>The general insignificance of white space (spaces, tabs, new lines) except in very limited cases. Indentation is optional and is therefore a matter of style and preference, plus programs can be written on as few or as many lines as you want.</li>
	<li>The use of semicolons to end statements, expressions and other constructs. Semicolons become the delimiter that the new line character is in white-space-significant languages.</li>
</ul>
JavaScript’s rules for curly braces, white space and semicolons are consistent with the C-family and its formal specification, known as the ECMAScript Language Specification makes this clear:
<blockquote>Certain ECMAScript statements (empty statement, variable statement, expression statement, do-while statement, continue statement, break statement, return statement, and throw statement) must be terminated with semicolons.</blockquote>
But it doesn’t end there–JavaScript introduces what’s known as <strong>Automatic Semicolon Insertion (ASI)</strong>. The specification continues:
<blockquote>Such semicolons may always appear explicitly in the source text. For convenience, however, such semicolons may be omitted from the source text in certain situations. These situations are described by saying that semicolons are automatically inserted into the source code token stream in those situations.</blockquote>
The general C-family rules for semicolons can be found in most teaching material for JavaScript and has been advocated by most of the prominent JavaScript personalities since 1995. In a <a href="https://brendaneich.com/2012/04/the-infernal-semicolon/">recent post</a>, JavaScript’s inventor, Brendan Eich, described ASI as “a syntactic error correction procedure”, (as in “<a href="https://brendaneich.com/2012/04/the-infernal-semicolon/#comment-12268">parsing error</a>”, rather than “user error”).

<strong><em>The rest of this article about semicolons in JavaScript can be found on <a title="JavaScript and Semicolons" href="http://dailyjs.com/2012/04/19/semicolons/">DailyJS</a>.</em></strong>
