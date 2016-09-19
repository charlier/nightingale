if (typeof(TestRecorder) == "undefined") {
    TestRecorder = {};
}

if (typeof(TestRecorder.Browser) == "undefined") {
    TestRecorder.Browser = {};
}

TestRecorder.Browser.captureEvent = (wnd, name, func) => {
    const lname = name.toLowerCase();
    const doc = wnd.document;
    wnd.captureEvents(Event[name.toUpperCase()]);
    wnd[`on${lname}`] = func;
}

TestRecorder.Browser.releaseEvent = (wnd, name, func) => {
    const lname = name.toLowerCase();
    const doc = wnd.document;
    wnd.releaseEvents(Event[name.toUpperCase()]);
    wnd[`on${lname}`] = null;
}

TestRecorder.Browser.getSelection = wnd => {
    const doc = wnd.document;
    if (wnd.getSelection) {
        return `${wnd.getSelection()}`;
    }
    else if (doc.getSelection) {
        return `${doc.getSelection()}`;
    }
    else if (doc.selection && doc.selection.createRange) {
        return `${doc.selection.createRange().text}`;
    }
    return "";
}

TestRecorder.Browser.windowHeight = wnd => {
    const doc = wnd.document;
    if (wnd.innerHeight) {
        return wnd.innerHeight;
    }
    else if (doc.documentElement && doc.documentElement.clientHeight) {
        return doc.documentElement.clientHeight;
    }
    else if (document.body) {
        return document.body.clientHeight;
    }
    return -1;
}

TestRecorder.Browser.windowWidth = wnd => {
    const doc = wnd.document;
    if (wnd.innerWidth) {
        return wnd.innerWidth;
    }
    else if (doc.documentElement && doc.documentElement.clientWidth) {
        return doc.documentElement.clientWidth;
    }
    else if (document.body) {
        return document.body.clientWidth;
    }
    return -1;
}

TestRecorder.Event = function(e) {
    this.event = (e) ? e : window.event;
}

TestRecorder.Event.LeftButton = 0;
TestRecorder.Event.MiddleButton = 1;
TestRecorder.Event.RightButton = 2;
TestRecorder.Event.UnknownButton = 3;

TestRecorder.Event.prototype.stopPropagation = function() {
    if (this.event.stopPropagation)
        this.event.stopPropagation();
}

TestRecorder.Event.prototype.preventDefault = function() {
    if (this.event.preventDefault)
        this.event.preventDefault();
}

TestRecorder.Event.prototype.type = function() {
    return this.event.type;
}

TestRecorder.Event.prototype.button = function() {
    if (this.event.button) {
        if (this.event.button == 2) {
            return TestRecorder.Event.RightButton;
        }
        return TestRecorder.Event.LeftButton;
    }
    else if (this.event.which) {
        if (this.event.which > 1) {
            return TestRecorder.Event.RightButton;
        }
        return TestRecorder.Event.LeftButton;
    }
    return TestRecorder.Event.UnknownButton;
}

TestRecorder.Event.prototype.target = function() {
    const t = (this.event.target) ? this.event.target : this.event.srcElement;
    if (t && t.nodeType == 3)
        return t.parentNode;
    return t;
}

TestRecorder.Event.prototype.keycode = function() {
    return (this.event.keyCode) ? this.event.keyCode : this.event.which;
}

TestRecorder.Event.prototype.keychar = function() {
    return String.fromCharCode(this.keycode());
}

TestRecorder.Event.prototype.shiftkey = function() {
    if (this.event.shiftKey)
        return true;
    return false;
}

TestRecorder.Event.prototype.posX = function() {
    if (this.event.pageX)
        return this.event.pageX;
    else if (this.event.clientX) {
        return this.event.clientX + document.body.scrollLeft;
    }
    return 0;
}

TestRecorder.Event.prototype.posY = function() {
    if (this.event.pageY)
        return this.event.pageY;
    else if (this.event.clientY) {
        return this.event.clientY + document.body.scrollTop;
    }
    return 0;
}

TestRecorder.TestCase = function() {
    this.title = "Test Case";
    this.items = new Array();
}

TestRecorder.TestCase.prototype.append = function(o) {
    this.items[this.items.length] = o;
    chrome.runtime.sendMessage({action: "append", obj: o});
}

TestRecorder.TestCase.prototype.peek = function() {
    return this.items[this.items.length - 1];
}

TestRecorder.TestCase.prototype.poke = function(o) {
    this.items[this.items.length - 1] = o;
    chrome.runtime.sendMessage({action: "poke", obj: o});
}

if (typeof(TestRecorder.EventTypes) == "undefined") {
    TestRecorder.EventTypes = {};
}

TestRecorder.EventTypes.OpenUrl = 0;
TestRecorder.EventTypes.Click = 1;
TestRecorder.EventTypes.Change = 2;
TestRecorder.EventTypes.Submit = 3;
TestRecorder.EventTypes.CheckPageTitle = 4;
TestRecorder.EventTypes.CheckPageLocation = 5;
TestRecorder.EventTypes.CheckTextPresent = 6;
TestRecorder.EventTypes.CheckValue = 7;
TestRecorder.EventTypes.CheckValueContains = 8;
TestRecorder.EventTypes.CheckText = 9;
TestRecorder.EventTypes.CheckHref = 10;
TestRecorder.EventTypes.CheckEnabled = 11;
TestRecorder.EventTypes.CheckDisabled = 12;
TestRecorder.EventTypes.CheckSelectValue = 13;
TestRecorder.EventTypes.CheckSelectOptions = 14;
TestRecorder.EventTypes.CheckImageSrc = 15;
TestRecorder.EventTypes.PageLoad = 16;
TestRecorder.EventTypes.ScreenShot = 17;
TestRecorder.EventTypes.MouseDown = 18;
TestRecorder.EventTypes.MouseUp = 19;
TestRecorder.EventTypes.MouseDrag = 20;
TestRecorder.EventTypes.MouseDrop = 21;
TestRecorder.EventTypes.KeyPress = 22;

TestRecorder.ElementInfo = function(element) {
    this.action = element.action;
    this.method = element.method;
    this.href = element.href;
    this.tagName = element.tagName;
    this.selector = this.getCleanCSSSelector(element);
    this.value = element.value;
    this.checked = element.checked;
    this.name = element.name;
    this.type = element.type;
    if (this.type)
        this.type = this.type.toLowerCase();
    if (element.form)
        this.form = {id: element.form.id, name: element.form.name};
    this.src = element.src;
    this.id = element.id;
    this.title = element.title;
    this.options = [];
    if (element.selectedIndex) {
        for (let i=0; i < element.options.length; i++) {
            const o = element.options[i];
            this.options[i] = {text:o.text, value:o.value};
        }
    }
    this.label = this.findLabelText(element);
}

TestRecorder.ElementInfo.prototype.findLabelText = function(element) {
    let label = this.findContainingLabel(element);
    let text;
    if (!label) {
        label = this.findReferencingLabel(element);
    }
    if (label) {
        text = label.innerHTML;
        text = text.replace('\n', ' ');
        text = text.replace(/<[^>]*>/g, ' ');
        text = text.replace(/^\W*/mg, '')
        text = text.replace(/\W*$/mg, '')
        text = text.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\s+/g, ' ');
    }

    return text;
}

TestRecorder.ElementInfo.prototype.findReferencingLabel = element => {
    const labels = window.document.getElementsByTagName('label');
    for (let i = 0; i < labels.length; i++) {
        if (labels[i].attributes['for'] &&
                labels[i].attributes['for'].value == element.id)
            return labels[i]
    }
}

TestRecorder.ElementInfo.prototype.findContainingLabel = function(element) {
    const parent = element.parentNode;
    if (!parent)
        return undefined;
    if (parent.tagName && parent.tagName.toLowerCase() == 'label')
        return parent;
    else
        return this.findContainingLabel(parent);
}

TestRecorder.ElementInfo.prototype.getCleanCSSSelector = function(element) {
    if(!element) return;
    let selector = element.tagName ? element.tagName.toLowerCase() : '';
    if(selector == '' || selector == 'html') return '';

    let tmp_selector = '';
    let accuracy = document.querySelectorAll(selector).length;
    if(element.id) {
        selector = `#${element.id.replace(/\./g, '\\.')}`;
        accuracy = document.querySelectorAll(selector).length
        if(accuracy==1) return selector;
    }
    if(element.className) {
        tmp_selector = `.${element.className.trim().replace(/ /g,".")}`;
        if(document.querySelectorAll(tmp_selector).length < accuracy) {
            selector = tmp_selector;
            accuracy = document.querySelectorAll(selector).length
            if(accuracy==1) return selector;
        }
    }
    const parent = element.parentNode;
    const parent_selector = this.getCleanCSSSelector(parent);

    if(parent_selector) {

        let matching_sibling = 0;
        const matching_nodes = document.querySelectorAll(`${parent_selector} > ${selector}`);
        for(var i=0; i<matching_nodes.length;i++) {
            if(matching_nodes[i].parentNode == parent) matching_sibling++;
        }
        if(matching_sibling > 1) {
            let index = 1;
            for (let sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) index++;
            selector = `${selector}:nth-child(${index})`;
        }

        selector_array = parent_selector.split(' ');
        if(selector_array.length>1) {
            for(var i=1;i<selector_array.length;i++) {
                tmp_selector = `${selector_array.slice(0,i).join(' ')} ${selector}`;
                if(document.querySelectorAll(tmp_selector).length == 1) {
                    selector = tmp_selector;
                    break;
                }
            }
        }

        accuracy = document.querySelectorAll(selector).length
        if(accuracy>1) {
            tmp_selector = `${parent_selector} ${selector}`;
            if(document.querySelectorAll(tmp_selector).length==1) {
                selector = tmp_selector;
            } else {
                selector = `${parent_selector} > ${selector}`;
            }
        }
    }

    return selector;
}

TestRecorder.DocumentEvent = function(type, target) {
    this.type = type;
    this.url = target.URL;
    this.title = target.title;
}

TestRecorder.ElementEvent = function(type, target, text) {
    this.type = type;
    this.info = new TestRecorder.ElementInfo(target);
    this.text = text ? text : recorder.strip(contextmenu.innertext(target));
}

TestRecorder.KeyEvent = function(target, text) {
    this.type = TestRecorder.EventTypes.KeyPress;
    this.info = new TestRecorder.ElementInfo(target);
    this.text = text;
}

TestRecorder.MouseEvent = function(type, target, x, y) {
    this.type = type;
    this.info = new TestRecorder.ElementInfo(target);
    this.x = x;
    this.y = y;
    this.text = recorder.strip(contextmenu.innertext(target));
}

TestRecorder.ScreenShotEvent = function() {
    this.type = TestRecorder.EventTypes.ScreenShot;
}

TestRecorder.OpenURLEvent = function(url) {
    this.type = TestRecorder.EventTypes.OpenUrl;
    this.url = url;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
}

TestRecorder.PageLoadEvent = function(url) {
    this.type = TestRecorder.EventTypes.OpenUrl;
    this.url = url;
    this.viaBack = back
}

TestRecorder.ContextMenu = function() {
    this.selected = null;
    this.target = null;
    this.window = null;
    this.visible = false;
    this.over = false;
    this.menu = null;
}

contextmenu = new TestRecorder.ContextMenu();


TestRecorder.ContextMenu.prototype.build = function(t, x, y) {
    const d = recorder.window.document;
    const b = d.getElementsByTagName("body").item(0);
    const menu = d.createElement("div");

    menu.setAttribute("style", `backgroundColor:#ffffff;color:#000000;border:1px solid #000000;padding:2px;position:absolute;display:none;top:${y}px;left:${x}px;border:1px;z-index:10000;`);

    menu.style.backgroundColor="#ffffff";
    menu.style.color="#000000";
    menu.style.border = "1px solid #000000";
    menu.style.padding="2px";
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.zIndex = "10000";
    menu.style.top = y.toString();
    menu.style.left = x.toString();
    menu.onmouseover=contextmenu.onmouseover;
    menu.onmouseout=contextmenu.onmouseout;

    const selected = TestRecorder.Browser.getSelection(recorder.window).toString();

    if (t.width && t.height) {
        menu.appendChild(this.item("Check Image Src", this.checkImgSrc));
    }

    else if (t.type == "text" || t.type == "textarea") {
        menu.appendChild(this.item("Check Text Value", this.checkValue));
        menu.appendChild(this.item("Check Enabled", this.checkEnabled));
        menu.appendChild(this.item("Check Disabled", this.checkDisabled));
    }

    else if (selected && (selected != "")) {
        this.selected = recorder.strip(selected);
        menu.appendChild(this.item("Check Text Appears On Page",
                this.checkTextPresent));
    }

    else if (t.href) {
        menu.appendChild(this.item("Check Link Text", this.checkText));
        menu.appendChild(this.item("Check Link Href", this.checkHref));
    }

    else if (t.selectedIndex || t.type == "option") {
        let name = "Check Selected Value";
        if (t.type != "select-one") {
            name = `${name}s`;
        }
        menu.appendChild(this.item(name, this.checkSelectValue));
        menu.appendChild(this.item("Check Select Options",
                this.checkSelectOptions));
        menu.appendChild(this.item("Check Enabled", this.checkEnabled));
        menu.appendChild(this.item("Check Disabled", this.checkDisabled));
    }

    else if (t.type == "button" || t.type == "submit") {
        menu.appendChild(this.item("Check Button Text", this.checkText));
        menu.appendChild(this.item("Check Button Value", this.checkValue));
        menu.appendChild(this.item("Check Enabled", this.checkEnabled));
        menu.appendChild(this.item("Check Disabled", this.checkDisabled));
    }

    else if (t.value) {
        menu.appendChild(this.item("Check Value", this.checkValue));
        menu.appendChild(this.item("Check Enabled", this.checkEnabled));
        menu.appendChild(this.item("Check Disabled", this.checkDisabled));
    }

    else {
        menu.appendChild(this.item("Check Page Location", this.checkPageLocation));
        menu.appendChild(this.item("Check Page Title", this.checkPageTitle));
        menu.appendChild(this.item("Screenshot", this.doScreenShot));
    }

    menu.appendChild(this.item("Cancel", this.cancel));

    b.insertBefore(menu, b.firstChild);
    return menu;
}

TestRecorder.ContextMenu.prototype.item = function(text, func) {
    const doc = recorder.window.document;
    const div = doc.createElement("div");
    const txt = doc.createTextNode(text);
    div.setAttribute("style", "padding:6px;border:1px solid #ffffff;");
    div.style.border = "1px solid #ffffff";
    div.style.padding = "6px";
    div.appendChild(txt);
    div.onmouseover = this.onitemmouseover;
    div.onmouseout = this.onitemmouseout;
    div.onclick = func;
    return div;
}

TestRecorder.ContextMenu.prototype.show = function(e) {
    if (this.menu) {
        this.hide();
    }
    const wnd = recorder.window;
    const doc = wnd.document;
    this.target = e.target();
    TestRecorder.Browser.captureEvent(wnd, "mousedown", this.onmousedown);

    const wh = TestRecorder.Browser.windowHeight(wnd);
    const ww = TestRecorder.Browser.windowWidth(wnd);
    let x = e.posX();
    let y = e.posY();
    if ((ww >= 0) && ((ww - x) < 100)) {
        x = x - 100;
    }
    if ((wh >= 0) && ((wh - y) < 100)) {
        y = y - 100;
    }
    const menu = this.build(e.target(), x, y);
    this.menu = menu;
    menu.style.display = "";
    this.visible = true;
    return;
}

TestRecorder.ContextMenu.prototype.hide = function() {
    const wnd = recorder.window;
    TestRecorder.Browser.releaseEvent(wnd, "mousedown", this.onmousedown);
    const d = wnd.document;
    const b = d.getElementsByTagName("body").item(0);
    this.menu.style.display = "none" ;
    b.removeChild(this.menu);
    this.target = null;
    this.visible = false;
    this.over = false;
    this.menu = null;
}

TestRecorder.ContextMenu.prototype.onitemmouseover = function(e) {
    this.style.backgroundColor = "#efefef";
    this.style.border = "1px solid #c0c0c0";
    return true;
}

TestRecorder.ContextMenu.prototype.onitemmouseout = function(e) {
    this.style.backgroundColor = "#ffffff";
    this.style.border = "1px solid #ffffff";
    return true;
}

TestRecorder.ContextMenu.prototype.onmouseover = e => {
    contextmenu.over = true;
}

TestRecorder.ContextMenu.prototype.onmouseout = e => {
    contextmenu.over = false;
}

TestRecorder.ContextMenu.prototype.onmousedown = e => {
    if(contextmenu.visible) {
        if (contextmenu.over == false) {
            contextmenu.hide();
            return true;
        }
        return true ;
    }
    return false;
}

TestRecorder.ContextMenu.prototype.record = o => {
    recorder.testcase.append(o);
    recorder.log(o.type);
    contextmenu.hide();
}

TestRecorder.ContextMenu.prototype.checkPageTitle = () => {
    const doc = recorder.window.document;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.DocumentEvent(et.CheckPageTitle, doc);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.doScreenShot = () => {
    const e = new TestRecorder.ScreenShotEvent();
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkPageLocation = () => {
    const doc = recorder.window.document;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.DocumentEvent(et.CheckPageLocation, doc);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkValue = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckValue, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkValueContains = () => {
    const s = contextmenu.selected;
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckValueContains, t, s);
    contextmenu.selected = null;
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.innertext = e => {
    const doc = recorder.window.document;
    if (document.createRange) {
        const r = recorder.window.document.createRange();
        r.selectNodeContents(e);
        return r.toString();
    } else {
        return e.innerText;
    }
}

TestRecorder.ContextMenu.prototype.checkText = () => {
    const t = contextmenu.target;
    let s = "";
    if (t.type == "button" || t.type == "submit") {
        s = t.value;
    }
    else {
        s = contextmenu.innertext(t);
    }
    s = recorder.strip(s);
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckText, t, s);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkTextPresent = () => {
    const t = contextmenu.target;
    const s = contextmenu.selected;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckTextPresent, t, s);
    contextmenu.selected = null;
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkHref = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckHref, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkEnabled = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckEnabled, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkDisabled = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckDisabled, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkSelectValue = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckSelectValue, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkSelectOptions = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckSelectOptions, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.checkImgSrc = () => {
    const t = contextmenu.target;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.ElementEvent(et.CheckImageSrc, t);
    contextmenu.record(e);
}

TestRecorder.ContextMenu.prototype.cancel = () => {
    contextmenu.hide();
}

TestRecorder.Recorder = function() {
    this.testcase = new TestRecorder.TestCase();
    this.logfunc = null;
    this.window = null;
    this.active = false;
}

recorder = new TestRecorder.Recorder();
recorder.logfunc = msg => {console.log(msg);};

TestRecorder.Recorder.prototype.start = function() {
    this.window = window;
    this.captureEvents();

    const actualCode = `(${() => {
    const overloadStopPropagation = Event.prototype.stopPropagation;
    Event.prototype.stopPropagation = function(){
        console.log(this);
        overloadStopPropagation.apply(this, arguments);
    };
}})();`;
    const script = document.createElement('script');
    script.textContent = actualCode;
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);

    this.active = true;
    this.log("recorder started");
}

TestRecorder.Recorder.prototype.stop = function() {
    this.releaseEvents();
    this.active = false;
    this.log("recorder stopped");
    return;
}

TestRecorder.Recorder.prototype.open = function(url) {
    const e = new TestRecorder.OpenURLEvent(url);
    this.testcase.append(e);
    this.log(`open url: ${url}`);
}

TestRecorder.Recorder.prototype.pageLoad = function() {
    const doc = recorder.window.document;
    const et = TestRecorder.EventTypes;
    const e = new TestRecorder.DocumentEvent(et.PageLoad, doc);
    this.testcase.append(e);
    this.log(`page loaded url: ${e.url}`);
}

TestRecorder.Recorder.prototype.captureEvents = function() {
    const wnd = this.window;
    TestRecorder.Browser.captureEvent(wnd, "contextmenu", this.oncontextmenu);
    TestRecorder.Browser.captureEvent(wnd, "drag", this.ondrag);
    TestRecorder.Browser.captureEvent(wnd, "mousedown", this.onmousedown);
    TestRecorder.Browser.captureEvent(wnd, "mouseup", this.onmouseup);
    TestRecorder.Browser.captureEvent(wnd, "click", this.onclick);
    TestRecorder.Browser.captureEvent(wnd, "change", this.onchange);
    TestRecorder.Browser.captureEvent(wnd, "keypress", this.onkeypress);
    TestRecorder.Browser.captureEvent(wnd, "select", this.onselect);
    TestRecorder.Browser.captureEvent(wnd, "submit", this.onsubmit);
}

TestRecorder.Recorder.prototype.releaseEvents = function() {
    const wnd = this.window;
    TestRecorder.Browser.releaseEvent(wnd, "contextmenu", this.oncontextmenu);
    TestRecorder.Browser.releaseEvent(wnd, "drag", this.ondrag);
    TestRecorder.Browser.releaseEvent(wnd, "mousedown", this.onmousedown);
    TestRecorder.Browser.releaseEvent(wnd, "mouseup", this.onmouseup);
    TestRecorder.Browser.releaseEvent(wnd, "click", this.onclick);
    TestRecorder.Browser.releaseEvent(wnd, "change", this.onchange);
    TestRecorder.Browser.releaseEvent(wnd, "keypress", this.onkeypress);
    TestRecorder.Browser.releaseEvent(wnd, "select", this.onselect);
    TestRecorder.Browser.releaseEvent(wnd, "submit", this.onsubmit);
}



TestRecorder.Recorder.prototype.clickaction = function(e) {
    if (!contextmenu.visible) {
        const et = TestRecorder.EventTypes;
        const t = e.target();
        if (t.href || (t.type && t.type == "submit") ||
                (t.type && t.type == "submit")) {
            this.testcase.append(new TestRecorder.ElementEvent(et.Click,e.target()));
        } else {
            recorder.testcase.append(
                    new TestRecorder.MouseEvent(
                            TestRecorder.EventTypes.Click, e.target(), e.posX(), e.posY()
                    ));
        }
    }
}

TestRecorder.Recorder.prototype.check = e => {
    contextmenu.show(e);
    const target = e.target();
    if (target.type) {
        const type = target.type.toLowerCase();
        if (type == "submit" || type == "button" || type == "image") {
            recorder.log(`check button == "${target.value}"`);
        }
    }
    else if (target.href) {
        if (target.innerText) {
            const text = recorder.strip(target.innerText);
            recorder.log(`check link == "${target.text}"`);
        }
    }
}

TestRecorder.Recorder.prototype.onpageload = function() {
    if (this.active) {
        recorder.captureEvents();
        if (this.testcase.peek()) {
            const last_event_type = this.testcase.peek().type;
            if (last_event_type != TestRecorder.EventTypes.OpenUrl &&
                    last_event_type != TestRecorder.EventTypes.Click &&
                    last_event_type != TestRecorder.EventTypes.Submit) {
                this.open(this.window.location.toString());
            }
        }

        if (this.window)
            this.pageLoad();
    }
}

TestRecorder.Recorder.prototype.onchange = e => {
    var e = new TestRecorder.Event(e);
    const et = TestRecorder.EventTypes;
    const v = new TestRecorder.ElementEvent(et.Change, e.target());
    recorder.testcase.append(v);
    recorder.log(`value changed: ${e.target().value}`);
}

TestRecorder.Recorder.prototype.onselect = e => {
    var e = new TestRecorder.Event(e);
    recorder.log(`select: ${e.target()}`);
}

TestRecorder.Recorder.prototype.onsubmit = e => {
    var e = new TestRecorder.Event(e);
    const et = TestRecorder.EventTypes;
    let t = e.target();
    while (t.parentNode && t.tagName != "FORM") {
        t = t.parentNode;
    }
    const v = new TestRecorder.ElementEvent(et.Submit, t);
    recorder.testcase.append(v);
    recorder.log(`submit: ${e.target()}`);
}

TestRecorder.Recorder.prototype.ondrag = e => {
    var e = new TestRecorder.Event(e);
    recorder.testcase.append(
            new TestRecorder.MouseEvent(
                    TestRecorder.EventTypes.MouseDrag, e.target(), e.posX(), e.posY()
            ));
}
TestRecorder.Recorder.prototype.onmousedown = e => {
    if(!contextmenu.visible) {
        var e = new TestRecorder.Event(e);
        if (e.button() == TestRecorder.Event.LeftButton) {
            recorder.testcase.append(
                new TestRecorder.MouseEvent(
                        TestRecorder.EventTypes.MouseDown, e.target(), e.posX(), e.posY()
                ));
        }
    }
}
TestRecorder.Recorder.prototype.onmouseup = e => {
    if(!contextmenu.visible) {
        var e = new TestRecorder.Event(e);
        if (e.button() == TestRecorder.Event.LeftButton) {
            recorder.testcase.append(
                    new TestRecorder.MouseEvent(
                            TestRecorder.EventTypes.MouseUp, e.target(), e.posX(), e.posY()
                    ));
        }
    }
}

TestRecorder.Recorder.prototype.onclick = e => {
    var e = new TestRecorder.Event(e);

    if (e.shiftkey()) {
        recorder.check(e);
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    if (e.button() == TestRecorder.Event.RightButton) {
        recorder.check(e);
        return true;
    } else if (e.button() == TestRecorder.Event.LeftButton) {
        recorder.clickaction(e);
        return true;
    }
    e.stopPropagation();
    e.preventDefault();
    return false;
}

TestRecorder.Recorder.prototype.oncontextmenu = e => {
    var e = new TestRecorder.Event(e);
    recorder.check(e);
    e.stopPropagation();
    e.preventDefault();
    return false;
}

TestRecorder.Recorder.prototype.onkeypress = e => {
    var e = new TestRecorder.Event(e);
    if (e.shiftkey() && (e.keychar() == 'S')) {
        recorder.testcase.append(new TestRecorder.ScreenShotEvent());
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

    const last = recorder.testcase.peek();
    if(last.type == TestRecorder.EventTypes.KeyPress) {
        last.text = last.text + e.keychar();
        recorder.testcase.poke(last);
    } else {
        recorder.testcase.append(
            new TestRecorder.KeyEvent(e.target(), e.keychar())
        );
    }
    return true;
}

TestRecorder.Recorder.prototype.strip = s => s.replace('\n', ' ').replace(/^\s*/, "").replace(/\s*$/, "")

TestRecorder.Recorder.prototype.log = function(text) {
    if (this.logfunc) {
        this.logfunc(text);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == "start") {
        recorder.start();
        sendResponse({});
    }
    if (request.action == "stop") {
        recorder.stop();
        sendResponse({});
    }
    if (request.action == "open") {
        recorder.open(request.url);
        sendResponse({});
    }
});

chrome.runtime.sendMessage({action: "get_status"}, response => {
    if (response.active) {
        recorder.start();
    }
});
