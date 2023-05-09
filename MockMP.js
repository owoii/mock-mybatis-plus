// 对数据进行维护,实现增删改方法
function MockMP(table) {
  this.like = true
  if (table == undefined) {
    return this
  }
  this.table = table
}
/**
 * 直接将数据对象添加到表单数组中
 * @param {*} entity
 */
MockMP.prototype.save = function (entity) {
  const saveEntity = Mock.mock({
    id: '@increment',
    ...entity
  })
  this.table.push(saveEntity)
}
/**
 * 将数据对象批量添加到表单数组中
 * @param {*} entitys 数据对象
 */
MockMP.prototype.saveBatch = function (entitys) {
  entitys.forEach((entity) => {
    this.table.push(entity)
  })
}

// == 删 ========================================

/**
 * 根据一个或者多个条件对象来进行删除,每一项都需要精确匹配才会删除
 * @param {*} conditions
 * @returns 删除的 id
 */
MockMP.prototype.delete = function (conditions) {
  console.log('=============', conditions)
  const { table } = this
  for (let i = 0; i < table.length; i++) {
    if (this.conditionsTest({ conditions, data: table[i], like: false })) {
      this.table.splice(i, 1)
      return i
    }
  }
}

/**
 * 根据 id 去删除数据,默认字段名为 id ,可以通过修改 key 来改变字段名
 * @param {*} id
 * @param {*} key
 */
MockMP.prototype.deleteById = function (id, key = 'id') {
  return this.delete({ [key]: id })
}

/**
 * 根据传入的 id 列表来删除多个数据,默认匹配字段 为 id,可通过修改 key 来更改字段
 * @param {*} idList id列表
 * @param {*} key 字段名
 */
MockMP.prototype.deleteBatchIds = function (idList, key = 'id') {
  idList.forEach((id) => {
    this.deleteById(id, key)
  })
}

// == 改 ========================================

/**
 * 根据给出的条件字段选择要修改的对象,以及传入新的对象,也就是新值
 * @param {Array<String>} conditions 条件对象
 * @param {*} entity 新数据
 * @returns
 */
MockMP.prototype.update = function ({ conditions, entity }) {
  const { table } = this
  // 根据传入的条件和实体对象构建出一个新的条件
  const updateConditions = {}
  conditions.forEach((key) => {
    updateConditions[key] = entity[key]
  })

  //遍历寻找需要修改的数据
  for (let i = 0; i < table.length; i++) {
    const data = table[i]
    if (
      this.conditionsTest({ conditions: updateConditions, data, like: false })
    ) {
      table[i] = Object.assign(data, entity)
      return i
    }
  }
}

/**
 * 根据 id 来修改新值,默认字段为 id,可传入 key 修改
 * @param {*} entity 新数据
 * @param {*} key 匹配字段
 */
MockMP.prototype.updateById = function (entity, key = 'id') {
  this.update({
    conditions: [key],
    entity
  })
}

/**
 * 根据 id 修改一组对象的数据
 * @param {*} entityList 新数据组,得有和字段相匹配的值,否则修改不会成功
 * @param {*} key 字段值
 */
MockMP.prototype.updateBatchById = function (entityList, key = 'id') {
  entityList.forEach((entity) => {
    this.updateById(entity, key)
  })
}

// == 查 ========================================

/**
 * 根据给出的条件对象查询一条数据
 * @param {Object}  conditions 条件对象
 * @param {boolean}  like 是否模糊搜索
 * @returns
 */
MockMP.prototype.select = function ({ conditions = {}, like }) {
  const { table } = this
  if (like == undefined) {
    like = this.like
  }
  for (let i = 0; i < table.length; i++) {
    //根据条件进行查找最先出现的结果,如果找到了,直接返回数据
    if (this.conditionsTest({ conditions, data: table[i], like })) {
      return table[i]
    }
  }
}

/**
 * 默认根据对象的 id 字段进行匹配,可以传入第二个参数 key 来修改字段名称
 * @param {number} id
 * @param {string} key
 * @returns
 */
MockMP.prototype.getById = function (id, key = 'id') {
  return this.select({
    conditions: { [key]: id }
  })
}

/**
 * 根据条件对象来查询一组数据,如果没有传入条件对象那么将返回所有数据,不会对数据进行比较
 * @param {*} conditions 条件对象
 * @param {*} like 是否模糊搜索,不传入使用默认值
 * @returns
 */
MockMP.prototype.list = function ({ conditions = {}, like }) {
  if (like == undefined) {
    like = this.like
  }
  //判断条件是否为空,如果条件为空,则返回所有数据
  if (Object.keys(conditions).length == 0) {
    return [...this.table]
  }

  //对数据进行测试,如果通过测试,则将数据进行返回
  return this.table.filter((column) =>
    this.conditionsTest({ conditions, data: column, like })
  )
}

// 对查询的数据列表进行分页
MockMP.prototype.page = function ({
  conditions = {},
  like,
  limit = 10,
  page = 1
} = {}) {
  if (like == undefined) {
    like = this.like
  }
  const selectData = this.list({ conditions, like })
  const total = selectData.length
  return {
    list: selectData.splice(limit * (page - 1), limit),
    total
  }
}

//根据给出的条件对数据进行测试,如果通过测试则返回 true
MockMP.prototype.conditionsTest = function ({ conditions, data, like }) {
  const conditionKey = Object.keys(conditions)
  // 如果 like 为 true,那么就会进行模糊匹配
  //如果条件值只有一个有效,那么就会进行精确匹配那一个值
  //对条件进行清理,值为空的属性删除
  conditionKey.forEach((k) => {
    if (conditions[k] == undefined) {
      delete conditions[k]
    }
  })
  if (like) {
    return conditionKey.every((condition) => {
      const reg = new RegExp(`${conditions[condition]}`, 'i')
      return reg.test(data[condition])
    })
  } else {
    return conditionKey.every((condition) => {
      return conditions[condition] == data[condition]
    })
  }
}

/**
 * 根据模版使用 MockJS 创建指定大小的数据
 * @param {*} template mock 模版
 * @param {*} size 大小
 * @returns
 */
MockMP.initData = function (template, size) {
  const _this = new MockMP()
  _this.table = []
  for (let i = 0; i < size; i++) {
    _this.table.push(Mock.mock(template))
  }
  return _this
}
const Mock = require('mockjs')
module.exports = MockMP
