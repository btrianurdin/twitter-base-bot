import * as express from 'express';
import * as Twit from 'twit';
 
type AppType = {
  owner_username: string;
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
};

type dmsType = {
  message_id: string;
  message: string;
  sender_id: string;
}

class App {
  private app: express.Application;
  private username: string;
  private twt: Twit;

  constructor({
    owner_username,
    consumer_key,
    consumer_secret,
    access_token,
    access_token_secret,
  }: AppType) {
    this.app = express();
    this.twt = new Twit({
      consumer_key,
      consumer_secret,
      access_token,
      access_token_secret,
    });
    this.username = owner_username;

    this.botStart();
  }

  private async botStart() {
    let dms: dmsType[] = [];

    while (true) {
      if (dms.length > 0) {
        for (const x in dms) {
          if (dms[x].message.length > 0 && dms[x].message.length < 280) {
            this.tweet(dms[x].message);
            this.removeDM(dms[x].message_id);
          }
        }

        dms = [];

      } else {

        dms = await this.readDM();
        if (dms.length === 0) {
          await this.delay(60);
        }
      }

    }
  }

  private async friendships(targetUsername: string): Promise<any> {
    try {
      const profile: any = await this.twt.get("friendships/show", {
        source_screen_name: this.username,
        target_screen_name: targetUsername,
      });

      return profile.data.relationship;
    } catch (err) {
      throw new Error("An Error: showProfile");
    }
  }

  private async isMutual(targetUsername: string): Promise<boolean> {
    const p: any = await this.friendships(targetUsername);

    return p.target.following && p.target.followed_by;
  }

  private tweet(status: string) {
    this.twt.post("statuses/update", { status }, (err, data, res) => {
      console.log(data);
    });
  }

  private removeDM(messageId: string | number) {
    (this.twt as any).delete(
      "direct_messages/events/destroy",
      { id: messageId },
      (err) => {
        if (!err) {
          console.log("successfull destroy message : ", messageId);
        }
      }
    );
  }

  private async readDM(): Promise<dmsType[]> {
    try {
      const _getdm: any = await this.twt.get("direct_messages/events/list");
      const dm = _getdm.data.events;
      let tmpDM: dmsType[] = [];

      for (const x in dm) {
        const messageData: Object = dm[x].message_create.message_data;

        if (!messageData.hasOwnProperty("attachment")) {
          tmpDM.unshift({
            message_id: dm[x].id,
            message: dm[x].message_create.message_data.text,
            sender_id: dm[x].message_create.sender_id,
          });
        }
      }

      await this.delay(60);
      return tmpDM;
    } catch (err) {
      console.log(err);
      await this.delay(60);
    }
  }

  // private async getMedia() {
  //   const oauth = new OAuth(
  //     "https://api.twitter.com/oauth/request_token",
  //     "https://api.twitter.com/oauth/access_token",
  //     process.env.API_KEY,
  //     process.env.API_SECRET_KEY,
  //     '1.0A', null, 'HMAC-SHA1'
  //   );

  //   const get = promisify(oauth.get.bind(oauth));

  //   try {
  //     const body = await get(
  //       `https://ton.twitter.com/1.1/ton/data/dm/1427543883844493316/1427543880262557709/E7Fio0-p.jpg`,
  //       process.env.ACCESS_TOKEN,
  //       process.env.ACCESS_SECRET_TOKEN
  //     );

  //     const create = fs.createWriteStream("E7Fio0-p.jpg");
  //     create.write(body);
  //     create.close();

  //   } catch(err) {
  //     console.log(err);
  //   }
  // }

  private botRun(): void {
    const stream = this.twt.stream("user");
    stream.on("direct_message", function (eventMsg) {
      console.log(eventMsg);
    });
  }

  private delay(seconds: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, seconds * 1000);
    });
  }

  public async run() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }
}

export default App;
