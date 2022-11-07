const fs = require('fs');
const Slack = require('slack-node');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const log = require('lighthouse-logger');
const desktopConfig = require('lighthouse/lighthouse-core/config/desktop-config.js');

(async () => {
  log.setLevel('info');
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {output: 'json', onlyCategories: ['performance'], port: chrome.port};
  var json = JSON.parse(fs.readFileSync('./config.json').toString());
  
  const site = json.URL
  const result = await lighthouse(site, options, desktopConfig);
  
  const reportJson = result.report;
  fs.writeFileSync('lighthousereport.json', reportJson);
  const report = JSON.parse(reportJson);
  const timetoInteract = (report.audits.interactive.displayValue);

  const strippedTime = timetoInteract.replace('s','')
  const performanceScore = result.lhr.categories.performance.score * 100
  const slackWebhook = json.SLACK_WEBHOOK;
  const slack = new Slack();
  if (slackWebhook != ""){
    slack.setWebhook(slackWebhook);
    message = ('The time to interact for ' + site + ' was ' + strippedTime + 'seconds' + '\n' + 'The Performance score was ' + performanceScore + '/100');

      slack.webhook({
        username: "Absurd Performance Bot",
        icon_emoji: ":warning:",
        text: message
    }, function(err, response) {
      console.log(err, response);
    });
  }
  await chrome.kill();
})();