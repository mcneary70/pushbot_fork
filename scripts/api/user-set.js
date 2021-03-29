const {TallyMap} = require("../models/tally-map");
const {emojiCacheFor} = require("../models/emoji");
const {Admin} = require("../roles");

class AvatarResolver {
  constructor(profile) {
    this.profile = profile;

    this.image24 = profile.image_24;
    this.image32 = profile.image_32;
    this.image48 = profile.image_48;
    this.image72 = profile.image_72;
    this.image192 = profile.image_192;
    this.image512 = profile.image_512;
    this.image1024 = profile.image_1024;
  }
}

class StatusResolver {
  constructor(profile) {
    this.message = profile.status_text;
    this.emoji = profile.status_emoji;
  }
}

class UserResolver {
  constructor(user) {
    this.user = user;
    this.slack = this.user.slack || {};
    this.profile = this.slack.profile || {};

    this.id = this.user.id;
    this.name = this.user.name;
    this.realName = this.user.real_name;

    this.timezone = this.slack.tz;
    this.presence = (this.slack.presence || "UNKNOWN").toUpperCase();
  }

  status() {
    return new StatusResolver(this.profile);
  }

  avatar() {
    return new AvatarResolver(this.profile);
  }

  roles(_args, req) {
    return req.robot.auth.userRoles(this.user).map((role) => {
      return {name: role};
    });
  }

  topReactionsGiven({limit}, req) {
    const emojiCache = emojiCacheFor(req.robot);

    const reactions = [];
    const emojiPromise = async (name, count) => {
      const url = await emojiCache.get(name);
      return {count, emoji: {name, url}};
    };

    TallyMap.reactionsGiven(req.robot).topForUser(
      this.id,
      limit,
      (err, reaction, count) => {
        if (err) throw err;
        reactions.push(emojiPromise(reaction, count));
      }
    );
    return Promise.all(reactions);
  }

  topReactionsReceived({limit}, req) {
    const emojiCache = emojiCacheFor(req.robot);

    const reactions = [];
    const emojiPromise = async (name, count) => {
      const url = await emojiCache.get(name);
      return {count, emoji: {name, url}};
    };

    TallyMap.reactionsReceived(req.robot).topForUser(
      this.id,
      limit,
      (err, reaction, count) => {
        if (err) throw err;
        reactions.push(emojiPromise(reaction, count));
      }
    );
    return Promise.all(reactions);
  }

  coordinatorToken(_args, req) {
    if (req.user !== this.user || !Admin.isAllowed(req.robot, req.user)) {
      return null;
    }

    return process.env.AZ_COORDINATOR_TOKEN;
  }
}

class UserSetResolver {
  me(_args, req) {
    return new UserResolver(req.user);
  }

  all(_args, req) {
    const resolvers = [];
    const userMap = req.robot.brain.users();
    for (const uid of Object.keys(userMap)) {
      resolvers.push(new UserResolver(userMap[uid]));
    }
    return resolvers;
  }

  withName({name}, req) {
    const user = req.robot.brain.userForName(name);
    return user && new UserResolver(user);
  }
}

module.exports = {UserSetResolver, UserResolver};
