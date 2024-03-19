#!/bin/sh

cmd=$1
case $cmd in
    "start")
        ;;
    "stop")
        ;;
    *)
        echo "Usage: run.sh [start|stop]"
        exit
        ;;
esac

mypath=`dirname $0`
/kroot/rel/default/bin/kpython3 $mypath/manager.py app $cmd
