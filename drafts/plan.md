
# 数据库方面

1. 数据库性能调优 https://www.zhihu.com/question/36431635
https://draveness.me/mysql-innodb/
2. 数据库为什么使用 B+ 树存储索引
3. 深度随机跳页

# 并发编程

1. volatile 作用 https://zhuanlan.zhihu.com/p/137193948


```sh
LOAD DATA LOCAL INFILE '/Users/chee/Desktop/chee-workspace/data-mock/mock_output/mock_students.txt' INTO TABLE student FIELDS TERMINATED BY ',' (name, sex, birth, phone, email, province, city, address);
LOAD DATA LOCAL INFILE '/Users/chee/Desktop/chee-workspace/data-mock/mock_output/mock_courses.txt' INTO TABLE course FIELDS TERMINATED BY ',' (name);
LOAD DATA LOCAL INFILE '/Users/chee/Desktop/chee-workspace/data-mock/mock_output/mock_score.txt' INTO TABLE student_course_score FIELDS TERMINATED BY ',' (student_id, course_id, score, create_date, create_timestamp);
```