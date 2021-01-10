const fs = require('fs')
const faker = require('faker/locale/zh_CN')

class ObjectMockFactory {
  /**
   * 时间格式化
   * @param date 时间日期对象 
   * @param fmt  格式化字符串
   */
  formatDate(date, fmt = 'yyyy-MM-dd hh:mm:ss') {
    const o = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds()
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  }
  create() {
    const mockObj = this.mock.apply(this, arguments)
    return Object.values(mockObj).join(',') + '\n'
  }
}

/**
 * 学生信息模拟器
 */
class StudentMockFactory extends ObjectMockFactory {
  mock(index, options) {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName()
    return {
      name: firstName + lastName,
      sex: faker.random.boolean() ? 1 : 2,
      birth: this.formatDate(faker.date.past()),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(firstName, lastName),
      province: faker.address.state(),
      city: faker.address.city(),
      address: faker.address.streetAddress()
    }
  }
}

/**
 * 课程信息模拟器
 */
class CourseMockFactory extends ObjectMockFactory {
  mock(index, options) {
    return {
      name: `课程${index}`
    }
  }
}

/**
 * 学生课程得分模拟器
 */
class StuCourseScoreMockFactory extends ObjectMockFactory {
  mock(index, options) {
    const { courseCnt } = options
    const stuId = Math.round(index / courseCnt)
    const courseId = index % courseCnt
    const createAt = faker.date.past()
    return {
      studentId: stuId,
      courseId: courseId,
      score: faker.random.number({ min: 1, max: 100, precision: 2 }),
      createDate: this.formatDate(createAt),
      createTimestamp: Math.round(createAt.getTime() / 1000)
    }
  }
}

/**
 * 数据模拟组件
 */
class DataMock {
  constructor(options = {
    stuCnt: 10000,
    courseCnt: 300,
    outputFolder: `${__dirname}/mock_output`
  }) {
    this.options = options
    const { stuCnt, courseCnt } = options
    this.startAt = Date.now()
    this.genCnt = 0
    this.duration = 0
    this.totalCnt = stuCnt + courseCnt + stuCnt * courseCnt
  }
  mockData() {
    const { stuCnt, courseCnt } = this.options
    this.mockObj(new StudentMockFactory(), 'mock_students.txt', stuCnt)
    this.mockObj(new CourseMockFactory(), 'mock_courses.txt', courseCnt)
    this.mockObj(new StuCourseScoreMockFactory(), 'mock_score.txt', stuCnt * courseCnt)
    const surplus = Date.now() - this.startAt
    console.log(`共计耗时：${String(Math.round(surplus / 60)).padStart(2, 0)}分:${String(surplus % 60).padStart(2, 0)}秒`)
  }
  printProgress() {
    if (Date.now() - this.lastRecordAt < 500) {
      return
    }
    this.lastRecordAt = Date.now()
    this.duration = Date.now() - this.startAt
    const percent = (this.genCnt * 100 / this.totalCnt).toFixed(1)
    const surplus = Math.round(((100 - percent) * (this.duration / percent)) / 1000)
    const surplusStr = `${String(Math.round(surplus / 60)).padStart(2, 0)}分:${String(surplus % 60).padStart(2, 0)}秒`
    console.clear()
    console.log(`数据生成进度：${percent}% - 预计还需 ${surplusStr} - ${this.genCnt}/${this.totalCnt}`)
  }
  mockObj(factory, fileName, cnt) {
    const { outputFolder } = this.options
    const targetFile = `${outputFolder}/${fileName}`
    let i = 1;
    while (i <= cnt) {
      fs.appendFileSync(targetFile, factory.create(i, this.options));
      i++;
      this.genCnt++
      this.printProgress()
    }
  }
}


new DataMock({
  stuCnt: 500,
  courseCnt: 20,
  outputFolder: `${__dirname}/mock_output`
}).mockData()