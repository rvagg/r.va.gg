#!/bin/sh

echo -n "What's your name? "
read name

runcmd() {
  echo -n "OK ${name}, what command shal I run? "
  read cmd

  echo "Here's the output of the command \`${cmd}\`, ${name}:\n"
  echo "-------------------------------------------------------------------------------"
  $cmd
  echo "-------------------------------------------------------------------------------"

  echo -n "\nMore commands ${name}? [Y/n] "
  read more
  if [ "$more" != "n" ]; then
    runcmd
  fi
}

runcmd
