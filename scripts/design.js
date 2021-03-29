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
        `https://protobot.org/#en`
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

        $(".randomized-text").each((i, element) => {
          if (i > 5) {
            return false;
          }
          const design = [];
          $(element)[0].children.forEach((child) => {
            if (child.type === "div") {
              design.push(scrub(child.data));
            }
          });

          // design.push($(".randomized-text .intro"))
          // design.push($(".randomized-text .design-item"))
          // design.push($(".randomized-text .constraint"))

          // res.send($(".randomized-text .intro"));
          res.send(`> ${design.join(" ")}`);

        });
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
