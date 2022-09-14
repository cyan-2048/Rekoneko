import EventEmitter from "./EventEmitter";

export default class Reddit extends EventEmitter {
  constructor({
    state = null,
    client_id = null,
    refresh_token = null,
    last_token = null,
    redirect_uri = "https://cyan.2048.reddit.kaios-oauth/auth0",
    duration = "permanent",
    scope = "subscribe vote mysubreddits submit save read privatemessages identity edit history",
    debug = false,
    loggedOut = false,
  }) {
    super();
    this.scope = scope;
    this.duration = duration;
    this.redirect_uri = redirect_uri;
    this.refresh_token = refresh_token;
    this.state = state;
    this.client_id = client_id;
    this.last_token = last_token;
    this.debug = debug;
    this.loggedOut = loggedOut;

    this._basicAuth = "Basic " + window.btoa(client_id + ":");

    this._debug("class init");
  }

  get token() {
    return this.last_token?.access_token || null;
  }

  get _bearerAuth() {
    return this.token ? "bearer " + this.token : null;
  }

  async tokenRetrieval(code) {
    const retrieval = this._expire2Date(
      await this._xhr({
        url: "https://www.reddit.com/api/v1/access_token",
        method: "post",
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirect_uri,
        },
        headers: {
          Authorization: this._basicAuth,
        },
      })
    );
    this.refresh_token = retrieval.refresh_token || null;
    this.emit("token", retrieval);
    this.last_token = retrieval;
    this._debug("retrieved token:", retrieval);
    return retrieval;
  }

  async refreshToken() {
    if (!this.refresh_token) throw Error("refresh token not provided!");
    if (this.last_token && new Date(this.last_token.expires_in) < new Date()) {
      // implement expired checker
      // only refresh token if necessary
      this._debug("refreshing token, last token expired on:", this.last_token.expires_in);
      const retrieval = this._expire2Date(
        await this._xhr({
          url: "https://www.reddit.com/api/v1/access_token",
          method: "post",
          params: {
            grant_type: "refresh_token",
            refresh_token: this.refresh_token,
          },
          headers: {
            Authorization: this._basicAuth,
          },
        })
      );
      this.emit("token", retrieval);
      this.last_token = retrieval;
      this._debug("retrieved token:", retrieval);
      return retrieval;
    } else {
      try {
        await this._xhr({
          method: "get",
          url: "https://oauth.reddit.com/api/v1/me",
          headers: {
            Authorization: this._bearerAuth,
          },
        });
      } catch (xhr) {
        alert(`Error Occured! \nStatus: ${xhr.status} ${xhr.statusText}`);
        throw xhr;
      }

      return this.last_token;
    }
  }

  async login() {
    const self = this; // just to not fuck up

    if (!this.state || !this.client_id) {
      throw Error("did not provide state or client_id");
    }
    if (this.refresh_token) {
      return this.refreshToken();
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

        function callback({ detail }) {
          delete window._oauth;
          responded = true;
          console.error(detail);
          clearInterval(interval);
          if (detail.state !== self.state) return err(Error("state provided is not the same!"));
          res(self.tokenRetrieval(detail.code));
        }

        if (!navigator.mozApps) {
          // if not kaios device...
          window._oauth = function (code) {
            callback({ detail: { code, state: self.state } });
            // NOTE: don't close pop-up window, we don't want to trigger the interval
          };
          return;
        }

        interval = setInterval(function () {
          if (responded) return;
          if (windowRef.closed) {
            clearInterval(interval);
            responded = true;

            const local = localStorage.oauth;
            if (local) {
              delete localStorage.oauth;
              return callback({ detail: JSON.parse(local) });
            }

            err(Error("popup window closed, no response was made."));
          }
        }, 500);
      });
    }
  }

  async logout() {
    return this._xhr({
      url: "https://www.reddit.com/api/v1/revoke_token",
      method: "post",
      params: {
        token: this.refresh_token || this.token,
      },
      headers: {
        Authorization: this._basicAuth,
      },
    });
  }

  async getPosts({ subreddit = null, user = null, listing = null, ...obj }) {
    const params = this._cleanObject(obj);
    return this._xhr({
      url:
        `https://${this.loggedOut ? "www" : "oauth"}.reddit.com${
          subreddit || user ? `${user ? "/user" : "/r"}/${user || subreddit}` : ""
        }/${listing || ""}${this.loggedOut ? ".json" : ""}?` + this._urlParams(params),
      method: "get",
      headers: {
        Authorization: this._bearerAuth || null,
      },
    });
  }

  async getUser({ user = null, listing = null, ...obj }) {
    const params = this._cleanObject(obj);
    return this._xhr({
      url:
        `https://${this.loggedOut ? "www" : "oauth"}.reddit.com/user/${user}${listing ? "/" + listing : ""}${
          this.loggedOut ? ".json" : ""
        }?` + this._urlParams(params),
      method: "get",
      headers: {
        Authorization: this._bearerAuth || null,
      },
    });
  }

  async _xhr({ url, method, params = null, body = null, headers = {}, callback = () => {} }) {
    const _method = method.toLowerCase();
    const urlEncodedPost = params && _method === "post";
    const _body = urlEncodedPost ? this._urlParams(params) : body;

    const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
    xhr.open(_method, url, true);
    callback(xhr);

    Object.entries(
      urlEncodedPost ? { ...headers, "Content-Type": "application/x-www-form-urlencoded" } : headers
    ).forEach(([a, b]) => {
      if (a && b) xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
    });

    return new Promise((res, err) => {
      xhr.onload = () => {
        try {
          if (!xhr.response) return res(undefined);
          const json = JSON.parse(xhr.response);
          res(json);
        } catch (error) {
          err(xhr);
        }
      };
      xhr.onerror = () => err(xhr);
      xhr.send(_body);
    });
  }
  _cleanObject(obj = {}) {
    const clean = {};
    for (const key in obj) {
      const value = obj[key];
      if (value !== null) {
        clean[key] = value;
      }
    }
    return clean;
  }
  _urlParams(obj = {}) {
    return new URLSearchParams(obj).toString();
  }
  _expire2Date({ expires_in, ...obj }) {
    return {
      ...obj,
      expires_in: new Date(Date.now() + (expires_in - 5) * 1000).toISOString(),
    };
  }
  _debug(...args) {
    if (this.debug) console.info("[Reddit]", ...args);
  }
}
