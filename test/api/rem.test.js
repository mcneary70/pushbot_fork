const {RemResolver} = require("../../scripts/api/rem");

describe("RemResolver", function () {
  let bot, resolver, req;
  let authorized;

  beforeEach(async function () {
    bot = new BotContext("../scripts/rem.js");
    await bot.loadAuth("1");

    usesDatabase(this);

    bot.createUser("1", "admin");
    authorized = bot.createUser("2", "authorized");

    await bot.say("admin", "@hubot rem bbb 000 = value 3");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "bbb 000".`);
    await bot.say("admin", "@hubot rem bbb 111 = value 4");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "bbb 111".`);
    await bot.say("admin", "@hubot rem bbb 222 = value 5");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "bbb 222".`);
    await bot.say("admin", "@hubot rem aaa 000 = value 0");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "aaa 000".`);
    await bot.say("admin", "@hubot rem aaa 111 = value 1");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "aaa 111".`);
    await bot.say("admin", "@hubot rem aaa 222 = value 2");
    await bot.waitForResponse(`@admin :ok_hand: I've learned "aaa 222".`);

    req = {robot: bot.getRobot(), user: authorized};
    resolver = new RemResolver();
  });

  afterEach(function () {
    bot.destroy();
  });

  describe("get", function () {
    it("retrieves a specific key", function () {
      expect(
        resolver.get(
          {key: "bbb 000"},
          {robot: bot.getRobot(), user: authorized}
        )
      ).to.deep.equal({key: "bbb 000", value: "value 3"});
    });

    it("returns null if the key is not known", function () {
      expect(
        resolver.get({key: "nope"}, {robot: bot.getRobot(), user: authorized})
      ).to.be.null;
    });
  });

  describe("search", function () {
    it("lists matching keys and values in a paginated connection", function () {
      const result = resolver.search({query: "111", first: 10}, req);
      expect(result).to.deep.equal({
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          count: 2,
          startCursor: "0",
          endCursor: "1",
        },
        edges: [
          {cursor: "0", node: {key: "aaa 111", value: "value 1"}},
          {cursor: "1", node: {key: "bbb 111", value: "value 4"}},
        ],
      });
    });

    it("lists all keys and values in a paginated connection", function () {
      const page0 = resolver.search({first: 5}, req);
      expect(page0).to.deep.equal({
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: true,
          count: 6,
          startCursor: "0",
          endCursor: "4",
        },
        edges: [
          {cursor: "0", node: {key: "aaa 000", value: "value 0"}},
          {cursor: "1", node: {key: "aaa 111", value: "value 1"}},
          {cursor: "2", node: {key: "aaa 222", value: "value 2"}},
          {cursor: "3", node: {key: "bbb 000", value: "value 3"}},
          {cursor: "4", node: {key: "bbb 111", value: "value 4"}},
        ],
      });

      const page1 = resolver.search({first: 5, after: "4"}, req);
      expect(page1).to.deep.equal({
        pageInfo: {
          hasPreviousPage: true,
          hasNextPage: false,
          count: 6,
          startCursor: "5",
          endCursor: "5",
        },
        edges: [{cursor: "5", node: {key: "bbb 222", value: "value 5"}}],
      });
    });

    describe("ordered lexicographically by key", function () {
      it("ascending", function () {
        const page0 = resolver.search(
          {first: 2, orderField: "KEY", orderDirection: "ASCENDING"},
          req
        );

        expect(page0).to.deep.equal({
          pageInfo: {
            hasPreviousPage: false,
            hasNextPage: true,
            count: 6,
            startCursor: "0",
            endCursor: "1",
          },
          edges: [
            {cursor: "0", node: {key: "aaa 000", value: "value 0"}},
            {cursor: "1", node: {key: "aaa 111", value: "value 1"}},
          ],
        });

        const page1 = resolver.search(
          {
            first: 2,
            after: "1",
            orderField: "KEY",
            orderDirection: "ASCENDING",
          },
          req
        );
        expect(page1).to.deep.equal({
          pageInfo: {
            hasPreviousPage: true,
            hasNextPage: true,
            count: 6,
            startCursor: "2",
            endCursor: "3",
          },
          edges: [
            {cursor: "2", node: {key: "aaa 222", value: "value 2"}},
            {cursor: "3", node: {key: "bbb 000", value: "value 3"}},
          ],
        });

        const page2 = resolver.search(
          {
            first: 2,
            after: "3",
            orderField: "KEY",
            orderDirection: "ASCENDING",
          },
          req
        );
        expect(page2).to.deep.equal({
          pageInfo: {
            hasPreviousPage: true,
            hasNextPage: false,
            count: 6,
            startCursor: "4",
            endCursor: "5",
          },
          edges: [
            {cursor: "4", node: {key: "bbb 111", value: "value 4"}},
            {cursor: "5", node: {key: "bbb 222", value: "value 5"}},
          ],
        });
      });

      it("descending", function () {
        const page0 = resolver.search(
          {first: 3, orderField: "KEY", orderDirection: "DESCENDING"},
          req
        );

        expect(page0).to.deep.equal({
          pageInfo: {
            hasPreviousPage: false,
            hasNextPage: true,
            count: 6,
            startCursor: "0",
            endCursor: "2",
          },
          edges: [
            {cursor: "0", node: {key: "bbb 222", value: "value 5"}},
            {cursor: "1", node: {key: "bbb 111", value: "value 4"}},
            {cursor: "2", node: {key: "bbb 000", value: "value 3"}},
          ],
        });

        const page1 = resolver.search(
          {
            first: 3,
            after: "2",
            orderField: "KEY",
            orderDirection: "DESCENDING",
          },
          req
        );
        expect(page1).to.deep.equal({
          pageInfo: {
            hasPreviousPage: true,
            hasNextPage: false,
            count: 6,
            startCursor: "3",
            endCursor: "5",
          },
          edges: [
            {cursor: "3", node: {key: "aaa 222", value: "value 2"}},
            {cursor: "4", node: {key: "aaa 111", value: "value 1"}},
            {cursor: "5", node: {key: "aaa 000", value: "value 0"}},
          ],
        });
      });
    });

    it("orders results randomly", function () {
      const page0 = resolver.search({first: 10, orderField: "RANDOM"}, req);

      expect(page0.pageInfo).to.deep.equal({
        hasPreviousPage: false,
        hasNextPage: false,
        count: 6,
        startCursor: "0",
        endCursor: "5",
      });
      expect(page0.edges).to.have.length(6);
      const nodes = page0.edges.map((e) => e.node);
      expect(nodes).to.deep.include({key: "aaa 000", value: "value 0"});
      expect(nodes).to.deep.include({key: "aaa 111", value: "value 1"});
      expect(nodes).to.deep.include({key: "aaa 222", value: "value 2"});
      expect(nodes).to.deep.include({key: "bbb 000", value: "value 3"});
      expect(nodes).to.deep.include({key: "bbb 111", value: "value 4"});
      expect(nodes).to.deep.include({key: "bbb 222", value: "value 5"});
    });
  });
});
