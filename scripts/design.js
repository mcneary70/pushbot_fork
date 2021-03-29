// Description:
//   Generate random product and service ideas.
//
// Commands:
//   hubot design - Generate random product and service ideas.

const {URL} = require("url");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const scrub = function (txt) {
  txt = txt.replace(/^[ \t\n]+/, "");
  txt = txt.replace(/[ \t\n]+$/, "");
  return txt;
};

module.exports = function (robot) {
  robot.respond(/design +/i, async function (res) {
    // const term = encodeURIComponent(res.match[1]);

    try {
      const response = await fetch(
        `https://protobot.org/`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
              "accept-languate": "en-US,en;q=0.9",
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "authority": "protobot.org",
              "referer": "smashwilson/pushbot"
            },
          }
      );
      const body = await response.text();
      // console.log(response.text());
      if (!response.ok) {
        res.send(
          `Protobot is designing a better protobot:\n${resp.status}: ${resp.statusText}` +
            "\n```\n" +
            body +
            "\n```\n"
        );
      } else {
        const $ = cheerio.load(body);

        console.log($.html());
        console.log(scrub($('#intro').text()));
        console.log(scrub($('#design-item').text()));
        console.log(scrub($('#constraint').text()));
        const design = []
        design.push(scrub($('#intro').text()));
        design.push(scrub($('#design-item').text()));
        design.push(scrub($('#constraint').text()));

        // $(".randomized-text").each((i, element) => {
        //   if (i > 5) {
        //     return false;
        //   }
        //   const design = [];
        //   $(element)[0].children.forEach((child) => {
        //     if (child.type === "div") {
        //       design.push(scrub(child.data));
        //     }
        //   });

          // design.push($(".randomized-text .intro"))
          // design.push($(".randomized-text .design-item"))
          // design.push($(".randomized-text .constraint"))

          // res.send($(".intro").text());
          res.send(`> ${design.join(" ")}`);
        //
        // });
      }
    } catch (err) {
      res.send(
        ":boom: THE INTERNET IS BROKEN file a ticket" +
          "\n```\n" +
          err.stack +
          "\n```\n`"
      );
    }
  });
};
