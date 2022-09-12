import EventEmitter from "./EventEmitter";

export default class Reddit extends EventEmitter {
  token = null;

  constructor({
    state = null,
    client_id = null,
    refresh_token = null,
    last_token = null,
    redirect_uri = "https://cyan.2048.reddit.kaios-oauth/auth0",
    duration = "permanent",
    scope = "subscribe vote mysubreddits submit save read privatemessages identity edit history",
  }) {
    super();
    this.scope = scope;
    this.duration = duration;
    this.redirect_uri = redirect_uri;
    this.refresh_token = refresh_token;
    this.state = state;
    this.client_id = client_id;
    this.last_token = last_token;
  }

  async tokenRetrieval(code) {
    return this._xhr({
      url: "https://www.reddit.com/api/v1/access_token",
      method: "post",
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirect_uri,
      },
      headers: {
        Authorization: `Basic ${btoa(this.client_id + ":")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  async login() {
    const self = this; // just to not fuck up

    if (!this.state || !this.client_id) {
      throw Error("did not provide state or client_id");
    }
    if (this.token) throw Error("token already exists, why you trying to login again?");
    if (this.refresh_token) {
      if (this.last_token) {
        // implement expired checker
        // only refresh token if necessary
      } else {
      }
    } else {
      const params = {
        client_id: this.client_id,
        response_type: "code",
        state: this.state,
        redirect_uri: this.redirect_uri,
        duration: this.duration,
        scope: this.scope,
      };
      const windowRef = window.open("https://www.reddit.com/api/v1/authorize.compact?" + this._urlParams(params));
      return new Promise((res, err) => {
        let responded = false,
          interval;
        windowRef.addEventListener("oauth", ({ detail }) => {
          console.error(detail);
          clearInterval(interval);
          responded = true;
          if (detail.state !== self.state) return err(Error("state provided is not the same!"));
          res(self.tokenRetrieval(detail.code));
        });

        interval = setInterval(function () {
          if (responded) return;
          if (windowRef.closed) {
            clearInterval(interval);
            responded = true;
            err(Error("popup window closed, no response was made."));
          }
        }, 500);
      });
    }
  }

  async _xhr({ url, method, params = null, body = null, headers = {} }) {
    const _method = method.toLowerCase();
    const _body = params && _method === "post" ? this._urlParams(params) : body;

    const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
    xhr.open(_method, url, true);

    Object.entries(headers).forEach(([a, b]) => {
      if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
    });

    return new Promise((res, err) => {
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.response);
          res(json);
        } catch (error) {
          err(Error("response was not JSON"));
        }
      };
      xhr.onerror = () => err(xhr);
      xhr.send(_body);
    });
  }
  _urlParams(obj = {}) {
    return new URLSearchParams(obj).toString();
  }
}
