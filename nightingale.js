if (typeof(EventTypes) == "undefined") {
  EventTypes = {};
}

EventTypes.OpenUrl = 0;
EventTypes.Click = 1;
EventTypes.Change = 2;
EventTypes.Submit = 3;
EventTypes.CheckPageTitle = 4;
EventTypes.CheckPageLocation = 5;
EventTypes.CheckTextPresent = 6;
EventTypes.CheckValue = 7;
EventTypes.CheckValueContains = 8;
EventTypes.CheckText = 9;
EventTypes.CheckHref = 10;
EventTypes.CheckEnabled = 11;
EventTypes.CheckDisabled = 12;
EventTypes.CheckSelectValue = 13;
EventTypes.CheckSelectOptions = 14;
EventTypes.CheckImageSrc = 15;
EventTypes.PageLoad = 16;
EventTypes.ScreenShot = 17;
EventTypes.MouseDown = 18;
EventTypes.MouseUp = 19;
EventTypes.MouseDrag = 20;
EventTypes.MouseDrop = 21;
EventTypes.KeyPress = 22;

class NightingaleRenderer {
  constructor(document) {
    this.document = document;
    this.title = "Testcase";
    this.items = null;
    this.history = new Array();
    this.last_events = new Array();
    this.screen_id = 1;
    this.unamed_element_id = 1;
  }

  text(txt) {
    this.document.writeln(txt);
  }

  stmt(text, indent) {
    if(indent==undefined) indent = 1;
    const output = (new Array(2*indent)).join(" ") + text;
    this.document.writeln(output);
  }

  cont(text) {
    this.document.writeln(`    ... ${text}`);
  }

  pyout(text) {
    this.document.writeln(`    ${text}`);
  }

  pyrepr(text, escape) {
    let s =  `'${text}'`;
    if(escape) s = s.replace(/(['"])/g, "\\$1");
    return s;
  }

  space() {
    this.document.write("\n");
  }

  regexp_escape(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
  }

  cleanStringForXpath(str, escape) {
      let parts  = str.match(/[^'"]+|['"]/g);
      parts = parts.map(part => {
          if (part === "'")  {
              return '"\'"'; // output "'"
          }

          if (part === '"') {
              return "'\"'"; // output '"'
          }
          return `'${part}'`;
      });
      let xpath = '';
      if(parts.length>1) {
        xpath = `concat(${parts.join(",")})`;
      } else {
        xpath = parts[0];
      }
      if(escape) xpath = xpath.replace(/(["])/g, "\\$1");
      return xpath;
  }

  render(with_xy) {
    this.with_xy = with_xy;
    const etypes = EventTypes;
    this.document.open();
    this.document.write("<" + "pre" + ">");
    this.writeHeader();
    let last_down = null;
    let forget_click = false;

    for (let i=0; i < this.items.length; i++) {
      const item = this.items[i];
      if(i==0) {
          if(item.type!=etypes.OpenUrl) {
              this.text("ERROR: the recorded sequence does not start with a url openning.");
          } else {
            this.startUrl(item);
            continue;
          }
      }

      if(item.type==etypes.MouseDown) {
        last_down = this.items[i];
        continue;
      }
      if(item.type==etypes.MouseUp && last_down) {
        if(last_down.x == item.x && last_down.y == item.y) {
          forget_click = false;
          continue;
        } else {
          item.before = last_down;
          this[this.dispatch[etypes.MouseDrag]](item);
          last_down = null;
          forget_click = true;
          continue;
        }
      }
      if(item.type==etypes.Click && forget_click) {
        forget_click = false;
        continue;
      }

      if(i>0 && item.type==etypes.Click &&
              ((this.items[i-1].type>=etypes.CheckPageTitle && this.items[i-1].type<=etypes.CheckImageSrc) || this.items[i-1].type==etypes.ScreenShot)) {
          continue;
      }

      if (this.dispatch[item.type]) {
        this[this.dispatch[item.type]](item);
      }
    }
    this.writeFooter();
    this.document.write("<" + "/" + "pre" + ">");
    this.document.close();
  }

  writeHeader() {
    const date = new Date();
    this.text("/*==============================================================================*/", 0);
    this.text(`/* Nightingale Recorder generated ${date} */`, 0);
    this.text("/*==============================================================================*/", 0);
    this.space();
    this.stmt("module.exports = {", 0);
    this.stmt("'test case': function(client) {", 1);
    this.stmt("return client", 2);
  }

  writeFooter() {
      this.space();
      this.stmt("}", 1);
      this.stmt("};", 0);
    }

  rewriteUrl(url) {
    return url;
  }

  shortUrl(url) {
    return url.substr(url.indexOf('/', 10), 999999999);
  }

  startUrl(item) {
    const url = this.pyrepr(this.rewriteUrl(item.url));
    this.stmt(`.url(${url})`, 3);
  }

  openUrl(item) {
    const url = this.pyrepr(this.rewriteUrl(item.url));
    this.stmt(`.url('${item.width}, ${item.height}')`, 3);
  }

  pageLoad(item) {
    const url = this.pyrepr(this.rewriteUrl(item.url));
    this.history.push(url);
  }

  normalizeWhitespace(s) {
    return s.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\s+/g, ' ');
  }

  getControl(item) {
    const type = item.info.type;
    const tag = item.info.tagName.toLowerCase();
    let selector;
    if ((type == "submit" || type == "button") && item.info.value)
      selector = `${tag}[type=${type}][value=${this.pyrepr(this.normalizeWhitespace(item.info.value))}]`;
    else if (item.info.name)
    selector = `${tag}[name=${this.pyrepr(item.info.name)}]`;
    else if (item.info.id)
    selector = `${tag}#${item.info.id}`;
    else
    selector = item.info.selector;

    return selector;
  }

  getControlXPath(item) {
    const type = item.info.type;
    let way;
    if ((type == "submit" || type == "button") && item.info.value)
      way = `@value=${this.pyrepr(this.normalizeWhitespace(item.info.value))}`;
    else if (item.info.name)
      way = `@name=${this.pyrepr(item.info.name)}`;
    else if (item.info.id)
    way = `@id=${this.pyrepr(item.info.id)}`;
    else
      way = 'TODO';

    return way;
  }

  getLinkXPath(item) {
    let way;
    if (item.text)
      way = `normalize-space(text())=${this.cleanStringForXpath(this.normalizeWhitespace(item.text), true)}`;
    else if (item.info.id)
      way = `@id=${this.pyrepr(item.info.id)}`;
    else if (item.info.href)
      way = `@href=${this.pyrepr(this.shortUrl(item.info.href))}`;
    else if (item.info.title)
      way = `title=${this.pyrepr(this.normalizeWhitespace(item.info.title))}`;

    return way;
  }

  mousedrag(item) {
    if(this.with_xy) {
      this.stmt(`.moveTo(null, ${item.before.x}, ${item.before.y})`, 3);
      this.stmt('.mouseButtonDown(0)', 3);
      this.stmt(`.moveTo(null, (${item.x}, ${item.y})`, 3);
      this.stmt('.mouseButtonUp(0)', 3);
    }
  }

  click(item) {
    const tag = item.info.tagName.toLowerCase();
    if(this.with_xy && !(tag == 'a' || tag == 'input' || tag == 'button')) {
      this.stmt(`.moveTo(null, ${item.x}, ${item.y})`, 3);
      this.stmt('.mouseButtonDown(0)', 3);
      this.stmt('.mouseButtonUp(0)', 3);
    } else {
      let selector;
      if (tag == 'a') {
        const xpath_selector = this.getLinkXPath(item);
        if(xpath_selector) {
          selector = `x("//a[${xpath_selector}]")`;
        } else {
          selector = item.info.selector;
        }
      } else if (tag == 'input' || tag == 'button') {
        selector = this.getFormSelector(item) + this.getControl(item);
        selector = `"${selector}"`;
      } else {
        selector = `"${item.info.selector}"`;
      }
      this.stmt(`.waitForElementPresent(${selector})`, 3);
      this.stmt(`.click(${selector})`, 3);
    }
  }

  getFormSelector(item) {
    const info = item.info;
    if(!info.form) {
      return '';
    }
    if(info.form.name) {
          return `form[name=${info.form.name}] `;
      } else if(info.form.id) {
      return `form#${info.form.id} `;
    } else {
      return "form ";
    }
  }

  keypress(item) {
    const text = item.text.replace('\n','').replace('\r', '\\r');
    this.stmt(`.waitForElementPresent("${this.getControl(item)}")`, 3);
    this.stmt(`.setValue("${this.getControl(item)}", "${text}")`, 3);
  }

  submit(item) {
    this.stmt("/* submit form */");
  }

  screenShot(item) {
    this.stmt(`.saveScreenShot("screenshot${this.screen_id}.png")`, 3);
    this.screen_id = this.screen_id + 1;
  }

  checkPageTitle(item) {
    const title = this.pyrepr(item.title, true);
    this.stmt(`.assert.title(${title})`, 3);
  }

  checkPageLocation(item) {
    const url = this.regexp_escape(item.url);
    this.stmt(`.assert.urlContains("${url}")`);
  }

  checkTextPresent(item) {
      const selector = `x("//*[contains(text(), ${this.pyrepr(item.text, true)})]")`;
      this.waitAndTestSelector(selector);
  }

  checkValue(item) {
    const type = item.info.type;
    const way = this.getControlXPath(item);
    let selector = '';
    if (type == 'checkbox' || type == 'radio') {
      let selected;
      if (item.info.checked)
        selected = '@checked'
      else
        selected = 'not(@checked)'
      selector = `x("//input[${way} and ${selected}]")`;
    }
    else {
      const value = this.pyrepr(item.info.value);
      const tag = item.info.tagName.toLowerCase();
      selector = `x("//${tag}[${way} and @value=${value}]")`;
    }
    this.waitAndTestSelector(selector);
  }

  checkText(item) {
    let selector = '';
    if ((item.info.type == "submit") || (item.info.type == "button")) {
        selector = `x("//input[@value=${this.pyrepr(item.text, true)}]")`;
    } else {
        selector = `x("//*[normalize-space(text())=${this.cleanStringForXpath(item.text, true)}]")`;
    }
    this.waitAndTestSelector(selector);
  }

  checkHref(item) {
    const href = this.pyrepr(this.shortUrl(item.info.href));
    const xpath_selector = this.getLinkXPath(item);
    if(xpath_selector) {
      selector = `x("//a[${xpath_selector} and @href=${href}]")`;
    } else {
      selector = `${item.info.selector}[href=${href}]`;
    }
    this.stmt(`.assert.elementPresent(${selector})`);
  }

  checkEnabled(item) {
      const way = this.getControlXPath(item);
      const tag = item.info.tagName.toLowerCase();
      this.waitAndTestSelector(`x("//${tag}[${way} and not(@disabled)]")`);
  }

  checkDisabled(item) {
    const way = this.getControlXPath(item);
    const tag = item.info.tagName.toLowerCase();
    this.waitAndTestSelector(`x("//${tag}[${way} and @disabled]")`);
  }

  checkSelectValue(item) {
    const value = this.pyrepr(item.info.value);
    const way = this.getControlXPath(item);
    this.waitAndTestSelector(`x("//select[${way}]/option[@selected and @value=${value}]")`);
  }

  checkSelectOptions(item) {
    this.stmt('/* TODO */');
  }

  checkImageSrc(item) {
    const src = this.pyrepr(this.shortUrl(item.info.src));
    this.waitAndTestSelector(`x("//img[@src=${src}]")`);
  }

  waitAndTestSelector(selector) {
    this.stmt(`.waitForElementPresent(${selector})`, 3);
    this.stmt(`.assert.elementPresent(${selector})`, 3);
  }
}

const d = {};
d[EventTypes.OpenUrl] = "openUrl";
d[EventTypes.Click] = "click";
d[EventTypes.Submit] = "submit";
d[EventTypes.CheckPageTitle] = "checkPageTitle";
d[EventTypes.CheckPageLocation] = "checkPageLocation";
d[EventTypes.CheckTextPresent] = "checkTextPresent";
d[EventTypes.CheckValue] = "checkValue";
d[EventTypes.CheckText] = "checkText";
d[EventTypes.CheckHref] = "checkHref";
d[EventTypes.CheckEnabled] = "checkEnabled";
d[EventTypes.CheckDisabled] = "checkDisabled";
d[EventTypes.CheckSelectValue] = "checkSelectValue";
d[EventTypes.CheckSelectOptions] = "checkSelectOptions";
d[EventTypes.CheckImageSrc] = "checkImageSrc";
d[EventTypes.PageLoad] = "pageLoad";
d[EventTypes.ScreenShot] = "screenShot";
d[EventTypes.MouseDrag] = "mousedrag";
d[EventTypes.KeyPress] = "keypress";

NightingaleRenderer.prototype.dispatch = d;

const cc = EventTypes;

const dt = new NightingaleRenderer(document);
window.onload = function onpageload() {
  let with_xy = false;
  if(window.location.search=="?xy=true") {
    with_xy = true;
  }
  chrome.runtime.sendMessage({action: "get_items"}, response => {
      dt.items = response.items;
      dt.render(with_xy);
  });
};
