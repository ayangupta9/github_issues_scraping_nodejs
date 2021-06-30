const fetch = require('node-fetch')
const fs = require('fs')
const cheerio = require('cheerio')
const path = require('path')

const mainUrl = 'https://github.com'
const startingUrl = mainUrl + '/topics'

async function getData (url) {
  const response = await fetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)

  let repoObjs = {}

  const topicsElement = $('.gutter a')

  console.log('Capturing Repositories...')
  for (let i = 0; i < topicsElement.length; i++) {
    const topicName = $(topicsElement[i])
      .attr('href')
      .split('/')[2]

    const topicUrl = 'https://github.com' + $(topicsElement[i]).attr('href')
    getTop10Repos(topicUrl)
    repoObjs[topicName] = await getTop10Repos(topicUrl)
  }
  console.log('Captured Repositories...')

  let issuesObj = {}

  console.log('Formulating Issues and creating directories...')
  for (const key in repoObjs) {
    const topicDirectoryPath = path.join(__dirname, 'github-topic-' + key)

    if (fs.existsSync(topicDirectoryPath) == false) {
      fs.mkdirSync(topicDirectoryPath)
      console.log('github-topic-' + key + ' directory created')
    }

    for (const item of repoObjs[key]) {
      const resultArr = await getIssues(item, key)
      const filePath = path.join(
        topicDirectoryPath,
        Object.keys(item)[0] + '.json'
      )

      fs.writeFileSync(filePath, JSON.stringify(resultArr))

      if (issuesObj[key] === undefined) {
        issuesObj[key] = [resultArr]
      } else {
        issuesObj[key].push(resultArr)
      }
    }

    console.log(
      `All ${key} repositories' issues added to github-topic-${key} directory`
    )
  }
  console.log('Job Complete')
}

async function getIssues (issueAndRepoObj, topic) {
  const repoName = Object.keys(issueAndRepoObj)[0]
  const url = issueAndRepoObj[repoName]

  const response = await fetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)
  const issuesNameElement = $('a.markdown-title')
  let issuesArr = []
  for (let i = 0; i < issuesNameElement.length; i++) {
    issuesArr.push({
      topic: topic,
      repoName: repoName,
      link: mainUrl + $(issuesNameElement[i]).attr('href'),
      name: $(issuesNameElement[i]).text()
    })
  }

  return issuesArr
}

async function getTop10Repos (topicUrl) {
  const response = await fetch(topicUrl)
  const body = await response.text()
  const $ = cheerio.load(body)
  const reposElement = $('article a.text-bold')
  const reposLink = []
  for (let i = 0; i < reposElement.length; i++) {
    const repoName = $(reposElement[i])
      .attr('href')
      .split('/')
      .pop()

    let obj = {}
    obj[repoName] = mainUrl + $(reposElement[i]).attr('href') + '/issues'
    reposLink.push(obj)
  }
  return reposLink
}

getData(startingUrl)
