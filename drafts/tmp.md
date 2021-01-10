```sh
nohup java \
-XX:+HeapDumpBeforeFullGC \
-XX:HeapDumpPath=$DUMP_PATH \
-XX:+DisableExplicitGC \
-jar xxx.jar --spring.profiles.active=$ACTION_MODE >> $LOG_PATH/server.log 2>&1 &

ps aux | head -1;ps aux |grep -v PID |sort -rn -k +4 | head -10

jmap -dump:live,format=b,file=m.hprof $PID

jstat -gcutil $PID 5s
```