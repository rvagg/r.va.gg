```json
{
    "date"   : "2026-01-26"
  , "title"  : "Git \"fixup!\" commits"
  , "author" : "Rod Vagg"
  , "path"   : "{title}.html"
}
```

```
$ git log --oneline
17baa3 feat: expose bare delete API
a1a790 fixup! feat: expose bare delete API
788c9c fixup! feat: expose bare delete API
83388b fixup! feat: expose bare delete API
```

_"OK, weird convention, but sure, I can get on board with that."_

It's not hard to see what the intention of the commit author is here, is it? They intend to squash these commits into one and these are just intermediate commits to show their progress&mdash;which is very helpful in a pull request.

This is a memory of mine from when I was still a relatively new Git user, watching a pro. My introduction to "fixup" commits.

But, it's not just one of those conventions arrived at by years of nerd cultural evolution (like `TODO`), it's a textual convention built into Git itself. It's a sideband signal used between `git commit` and `git rebase` for cleanly drafting commits and finally squashing them into one (or more) final commit.

As a programmer you have a choice: you can (a) make each commit an informative unit that helps with historical analysis, including bisecting to find bugs, or (b) treat it as an append-only log of your stream of consciousness. I tend to view these questions with an eye for maintenance. What would my future self find useful here? What would future maintainers or spelunkers of this code find useful for understanding how it evolved?

If you're comfortable with crufty history, this article probably isn't for you. But if you'd rather your commits tell a coherent story, `fixup!` is a useful tool for getting there without losing your work-in-progress trail during review.

### Rebase and squash basics

`git rebase -i` is how we rewrite Git history. Run it with a range like `git rebase -i HEAD~5` and you'll get an editor with your commits listed, each prefixed with `pick`. The help text at the bottom is a wall of options, but only a few matter here:

```
# p, pick <commit> = use commit
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
```

Change `pick` to `s` and that commit gets folded into the one above it, with both messages concatenated for you to edit. Change it to `f` and the commit is folded in but its message is thrown away—just what you want for throwaway commits like `bork`, `whoops`, or `make CI pass, attempt 4 🤞`.

### `--autosquash`

Here's where the `fixup!` magic comes in. `git rebase` comes with an `--autosquash` argument. Instead of all of your commits defaulting to the `pick` command, `--autosquash` will look through the commit **subjects** to find commits that you identified as needing to be squashed when you created them. Instead of `TODO: squash this`, your commit message can indicate to Git that you intend to squash it.

A commit subject that starts with the special string `fixup!` is what `--autosquash` is looking for. When it finds one, it looks at the rest of the subject to figure out what commit you want to squash it in to. Git will look back in the list of commits you're rebasing and if one matches the text following `fixup! `, it will mark it as a `fixup`.

It's one of the few places in Git where commit subject text is a programmatic concern—they're not just for humans. You might wonder why Git doesn't use the commit hash instead, but since you're clearly planning to rebase (and hashes change when you rebase), text matching is the only thing that survives the rewrite.

The commit sequence:

```
17baa3 feat: expose bare delete API
a1a790 fixup! feat: expose bare delete API
788c9c fixup! feat: expose bare delete API
83388b fixup! feat: expose bare delete API
```

Running `git rebase -i --autosquash HEAD~4` will give you a rebase command file like this:

```
pick 17baa3 feat: expose bare delete API
fixup a1a790 fixup! feat: expose bare delete API
fixup 788c9c fixup! feat: expose bare delete API
fixup 83388b fixup! feat: expose bare delete API
```

Simply saving and exiting and letting `git rebase` do its thing will result in a single commit as a combination of the four in the list, with no additional commit message editor step (like with `squash`) and no evidence of the intermediate commits in the commit message.

### Making `--autosquash` the default

`--autosquash` is a lot to type for something you'll want every time. Set it once and forget about it:

```
$ git config --global rebase.autoSquash true
```

Now `git rebase -i` automatically reorders and marks your `fixup!` commits. I set this years ago and haven't thought about it since.

### Reordering

When using `git rebase -i` you can reorder commits in your git history just by moving the list around and not even changing `pick`. You can do the same when you squash commits. But `fixup!` commits can also reorder for you automatically in `--autosquash` mode. After matching the commit subject after `fixup! ` to another commit in the list, `git rebase -i` will move your fixup commit up to the appropriate commit, again letting you save and exit and having `git rebase` take care of the rest.

If our Git history looked like this:

```
17baa3 feat: expose bare delete API
a1a790 fixup! feat: expose bare delete API
dd81a1 doc: document public delete API
88a910 fixup! feat: expose bare delete API
000fc1 fixup! feat: expose bare delete API
```

Then our `git rebase -i --autosquash HEAD~5` will result in a rebase command file:

```
pick 17baa3 feat: expose bare delete API
fixup a1a790 fixup! feat: expose bare delete API
fixup 88a910 fixup! feat: expose bare delete API
fixup 000fc1 fixup! feat: expose bare delete API
pick dd81a1 doc: document public delete API
```

Whether or not the squash will happen without conflicts is another matter, so make sure you're not tripping over yourself with reordering or are prepared for the inevitable conflict resolution.

### Don't `fixup!` by hand

You don't (normally) create fixup commit subjects manually. `git commit` comes equipped with a `--fixup` argument that will do it for you. `fixup`, `fix up`, `FIX ME UP` won't cut it (although these are common on GitHub when people are newly encountering this "convention", I may have even been guilty of this), it has to be `fixup! ` followed by the original commit subject.

`--fixup` requires an argument, the commit hash that you're wanting to squash in to. You may need to look at your commit log to find the base commit, but once you have it, you can keep on running `git commit --fixup <commit> ...` and append as many `fixup!` commits as you want.

The first fixup commit has an easy shortcut, however. `HEAD` in Git-speak refers to the latest commit on the branch you're on, and Git uses this in most places it would otherwise accept a hash. So, if you forgot to add that newline character at the end of the file that you know Bruce is going to complain about, add it and run `git commit -a --fixup HEAD` and you have your fixup commit.

Someone with a more sloppy mind might be more comfortable pushing `HEAD` further than you, however. Repeated subsequent uses of `--fixup HEAD` does work, but your commits are going to get out of control:

```
17baa3 feat: expose bare delete API
a1a790 fixup! feat: expose bare delete API
13accc fixup! fixup! feat: expose bare delete API
6446df fixup! fixup! fixup! feat: expose bare delete API
787715 fixup! fixup! fixup! fixup! feat: expose bare delete API
```

Since `--autosquash` is matching commit subject trailing `fixup! `, all it will do is match the previous commit for each of these and give you a series of `fixup` commands which will essentially be what you want. This can get very messy when you have a more complicated sequence of `pick` and `fixup` commits, however.

### `squash!` too?

Yes, there's also `squash!`. It works the same way as `fixup!` but instead of discarding the commit message, it keeps it for editing during the rebase. When `--autosquash` encounters a `squash!` commit, it marks it with `s` (squash) instead of `f` (fixup), so you'll get the commit message editor with both messages concatenated.

Use `git commit --squash <commit>` to create these. It's useful when you want to amend both the content *and* the commit message of an earlier commit.

### Clean pull request history

Where `fixup!` commits really shine is in pull request workflows. Instead of amending commits and force-pushing every time you address review feedback, you can push `fixup!` commits that show exactly what changed since the last review. Reviewers can see incremental changes without having to re-read the entire diff.

Before merge, you run `git rebase -i --autosquash` locally to collapse everything into clean commits, then force-push one final time.

Some teams use GitHub Actions like [Block Fixup Commit Merge](https://github.com/marketplace/actions/block-fixup-commit-merge) to prevent merging PRs that still contain `fixup!` commits—a handy reminder if you forget to squash.

### GitHub's merge options

If you're hoping GitHub will auto-squash your `fixup!` commits when you hit that merge button, I have bad news: it doesn't. The "Rebase and merge" option does a plain rebase without `--autosquash`. There's a [long-standing feature request](https://github.com/orgs/community/discussions/40804) for this, but GitHub hasn't acted on it.

Your options:

1. **Rebase locally before merge**: Run `git rebase -i --autosquash`, force-push, then use "Rebase and merge" or a regular merge.

2. **Use "Squash and merge"**: If you're happy collapsing the entire PR into a single commit, this works fine. Just remember to clean up the commit message in the GitHub UI before confirming—otherwise it'll include all those `fixup!` subjects in the message body, which looks a bit untidy.

I prefer keeping a linear commit history, so I use either "Rebase and merge" or "Squash and merge" depending on the PR. For small PRs or those where the intermediate commits aren't meaningful, "Squash and merge" is convenient enough if you remember to tidy the message.

### Rebase pain

One more thing: if you're rebasing a branch against an updated base (say, pulling in recent changes from `main`), do yourself a favour and squash your `fixup!` commits *first*.

Rebasing a branch with lots of `fixup!` commits can be extremely painful. Each commit in the sequence might conflict with the new base, and you'll be resolving essentially the same conflicts multiple times—once for the original commit and again for each `fixup!` that touches the same lines. Squash them down into coherent commits before attempting the rebase and you'll only deal with each conflict once.
