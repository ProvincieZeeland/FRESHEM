/**----------------------------------------------------------------------------------------------------
 * Utilities.
 *
 * The ol_ext_* methods are copied from ol-ext.
 *
 * European Union Public Licence V. 1.2
 * EUPL © the European Union 2007, 2016
 *
 * Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 */

/**-----------------------------------------------------------------------------
 * Disable the console functions.
 */
export let disableConsoleLog = function() {
  let methods,i;
  if (!window.console)
    window.console = {};
  methods = ["log", "debug", "warn", "info"];
  for(i=0;i<methods.length;i++){
    console[methods[i]] = function(){};
  }
}
/**
 * Create an element
 * @param {string} tagName The element tag, use 'TEXT' to create a text node
 * @param {*} options
 *  @param {string} options.className className The element class name
 *  @param {Element} options.parent Parent to append the element as child
 *  @param {Element|string} [options.html] Content of the element (if text is not set)
 *  @param {string} [options.text] Text content (if html is not set)
 *  @param {Element|string} [options.options] when tagName = SELECT a list of options as key:value to add to the select
 *  @param {string} [options.any] Any other attribut to add to the element
 */
export let ol_ext_element_create = function (tagName, options) {
  options = options || {};
  let elt;
  // Create text node
  if (tagName === 'TEXT') {
    elt = document.createTextNode(options.html||'');
    if (options.parent) options.parent.appendChild(elt);
  } else {
    // Other element
    elt = document.createElement(tagName);
    if (/button/i.test(tagName)) elt.setAttribute('type', 'button');
    for (let attr in options) {
      switch (attr) {
        case 'className': {
          if (options.className && options.className.trim) elt.setAttribute('class', options.className.trim());
          break;
        }
        case 'text': {
          elt.innerText = options.text;
          break;
        }
        case 'html': {
          if (options.html instanceof Element) elt.appendChild(options.html)
          else if (options.html!==undefined) elt.innerHTML = options.html;
          break;
        }
        case 'parent': {
          if (options.parent) options.parent.appendChild(elt);
          break;
        }
        case 'options': {
          if (/select/i.test(tagName)) {
            for (let i in options.options) {
              ol_ext_element_create('OPTION', {
                html: i,
                value: options.options[i],
                parent: elt
              })
            }
          }
          break;
        }
        case 'style': {
          ol_ext_element_setStyle(elt, options.style);
          break;
        }
        case 'change':
        case 'click': {
          ol_ext_element_addListener(elt, attr, options[attr]);
          break;
        }
        case 'on': {
          for (let e in options.on) {
            ol_ext_element_addListener(elt, e, options.on[e]);
          }
          break;
        }
        case 'checked': {
          elt.checked = !!options.checked;
          break;
        }
        default: {
          elt.setAttribute(attr, options[attr]);
          break;
        }
      }
    }
  }
  return elt;
}
/**
 * Add a set of event listener to an element
 * @param {HTMLElement|Element|Document} element
 * @param {string|Array<string>} eventType
 * @param {function} fn
 * @param useCapture
 */
export let ol_ext_element_addListener = function (element, eventType, fn, useCapture ) {
  if (typeof eventType === 'string') eventType = eventType.split(' ');
  eventType.forEach(function(e) {
    element.addEventListener(e, fn, useCapture);
  });
}
/**
 * Add a set of event listener to an element
 * @param {HTMLElement|Element|Document} element
 * @param {string|Array<string>} eventType
 * @param {function} fn
 */
export let ol_ext_element_removeListener = function (element, eventType, fn) {
  if (typeof eventType === 'string') eventType = eventType.split(' ');
  eventType.forEach(function(e) {
    element.removeEventListener(e, fn);
  });
}
/** Set style of an element
 * @param {HTMLElement} el the element
 * @param {*} st list of style
 */
export let ol_ext_element_setStyle = function(el, st) {
  for (let s in st) {
    switch (s) {
      case 'top':
      case 'left':
      case 'bottom':
      case 'right':
      case 'minWidth':
      case 'maxWidth':
      case 'width':
      case 'height': {
        if (typeof(st[s]) === 'number') {
          el.style[s] = st[s]+'px';
        } else {
          el.style[s] = st[s];
        }
        break;
      }
      default: {
        el.style[s] = st[s];
      }
    }
  }
}
/**
 * Get style propertie of an element
 * @param {HTMLElement} el the element
 * @param {string} styleProp Propertie name
 * @return {*} style value
 */
export let ol_ext_element_getStyle = function(el, styleProp) {
  // http://devdoc.net/web/developer.mozilla.org/en-US/docs/Web/API/Element/runtimeStyle.html
  // Nonstandard:
  //   currentStyle
  //   runtimeStyle   => style

  let value, defaultView = (el.ownerDocument || document).defaultView;
  // W3C standard way:
  if (defaultView && defaultView.getComputedStyle) {
    // sanitize property name to css notation
    // (hypen separated words eg. font-Size)
    styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
    value = defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
  }
  if (/px$/.test(value)) return parseInt(value);
  return value;
}
/** Get outerHeight of an element
 * @param {HTMLElement} elt
 * @return {number}
 */
export let ol_ext_element_outerHeight = function(elt) {
  return elt.offsetHeight + ol_ext_element_getStyle(elt, 'marginBottom')
}
/**
 * Test if an element is hihdden
 * @param {HTMLElement} element
 * @return {boolean}
 */
export let ol_ext_element_hidden = function (element) {
  return ol_ext_element_getStyle(element, 'display') === 'none';
}
/**
 * Show an element
 * @param {HTMLElement} element
 */
export let ol_ext_element_show = function (element) {
  element.style.display = '';
}
/**
 * Hide an element
 * @param {HTMLElement} element
 */
export let ol_ext_element_hide = function (element) {
  element.style.display = 'none';
}
/** Set inner html or append a child element to an element
 * @param {HTMLElement} element
 * @param {Element|string} html Content of the element
 */
export let ol_ext_element_setHTML = function(element, html) {
  if (html instanceof Element) element.appendChild(html)
  else if (html!==undefined) element.innerHTML = html;
}
/** Make a div scrollable without scrollbar.
 * On touch devices the default behavior is preserved
 * @param {HTMLElement} elt
 * @param {*} options
 *  @param {function} [options.onmove] a function that takes a boolean indicating that the div is scrolling
 *  @param {boolean} [options.vertical=false]
 *  @param {boolean} [options.animate=true] add kinetic to scroll
 *  @param {boolean} [options.mousewheel=false] enable mousewheel to scroll
 *  @param {boolean} [options.minibar=false] add a mini scrollbar to the parent element (only vertical scrolling)
 * @returns {Object} an object with a refresh function
 */
export let ol_ext_element_scrollDiv = function(elt, options) {
  options = options || {};
  let pos = false;
  let speed = 0;
  let d, dt = 0;

  let onmove = (typeof(options.onmove) === 'function' ? options.onmove : function(){});
  //let page = options.vertical ? 'pageY' : 'pageX';
  let page = options.vertical ? 'screenY' : 'screenX';
  let scroll = options.vertical ? 'scrollTop' : 'scrollLeft';
  let moving = false;
  // Factor scale content / container
  let scale, isbar;

  // Update the minibar
  let updateCounter = 0;
  let updateMinibar = function() {
    if (scrollbar) {
      updateCounter++;
      setTimeout(updateMinibarDelay);
    }
  }
  let updateMinibarDelay = function() {
    if (scrollbar) {
      updateCounter--;
      // Prevent multi call
      if (updateCounter) return;
      // Container height
      let pheight = elt.clientHeight;
      // Content height
      let height = elt.scrollHeight;
      // Set scrollbar value
      scale = pheight / height;
      scrollbar.style.height = scale * 100 + '%';
      scrollbar.style.top = (elt.scrollTop / height * 100) + '%';
      scrollContainer.style.height = pheight + 'px';
      // No scroll
      if (pheight > height - .5) scrollContainer.classList.add('ol-100pc');
      else scrollContainer.classList.remove('ol-100pc');
    }
  }

  // Handle pointer down
  let onPointerDown = function(e) {
    // Prevent scroll
    if (e.target.classList.contains('ol-noscroll')) return;
    // Start scrolling
    moving = false;
    pos = e[page];
    dt = new Date();
    elt.classList.add('ol-move');
    // Prevent elt dragging
    e.preventDefault();
    // Listen scroll
    window.addEventListener('pointermove', onPointerMove);
    ol_ext_element_addListener(window, ['pointerup','pointercancel'], onPointerUp);
  }

  // Register scroll
  let onPointerMove = function(e) {
    if (pos !== false) {
      let delta = (isbar ? -1/scale : 1) * (pos - e[page]);
      moving = moving || Math.round(delta)
      elt[scroll] += delta;
      d = new Date();
      if (d-dt) {
        speed = (speed + delta / (d - dt))/2;
      }
      pos = e[page];
      dt = d;
      // Tell we are moving
      if (delta) onmove(true);
    } else {
      moving = true;
    }
  };

  // Animate scroll
  let animate = function(to) {
    let step = (to>0) ? Math.min(100, to/2) : Math.max(-100, to/2);
    to -= step;
    elt[scroll] += step;
    if (-1 < to && to < 1) {
      if (moving) setTimeout(function() { elt.classList.remove('ol-move'); });
      else elt.classList.remove('ol-move');
      moving = false;
      onmove(false);
    } else {
      setTimeout(function() {
        animate(to);
      }, 40);
    }
  }

  // Initialize scroll container for minibar
  let scrollContainer, scrollbar;
  if (options.vertical && options.minibar) {
    let init = function(b) {
      // only once
      elt.removeEventListener('pointermove', init);
      // noinspection JSUnresolvedReference
      elt.parentNode.classList.add('ol-miniscroll');
      scrollbar = ol_ext_element_create('DIV');
      scrollContainer = ol_ext_element_create('DIV', {
        className: 'ol-scroll',
        html: scrollbar
      });
      elt.parentNode.insertBefore(scrollContainer, elt);
      // Move scrollbar
      scrollbar.addEventListener('pointerdown', function(e) {
        isbar = true;
        onPointerDown(e)
      });
      // Handle mousewheel
      if (options.mousewheel) {
        ol_ext_element_addListener(scrollContainer,
          ['mousewheel', 'DOMMouseScroll', 'onmousewheel'],
          function(e) { onMouseWheel(e) }
        );
        ol_ext_element_addListener(scrollbar,
          ['mousewheel', 'DOMMouseScroll', 'onmousewheel'],
          function(e) { onMouseWheel(e) }
        );
      }
      // Update on enter
      elt.parentNode.addEventListener('pointerenter', updateMinibar);
      // Update on resize
      window.addEventListener('resize', updateMinibar);
      // Update
      if (b!==false) updateMinibar();
    };
    // Allready inserted in the DOM
    if (elt.parentNode) init(false);
    // or wait when ready
    else elt.addEventListener('pointermove', init);
    // Update on scroll
    elt.addEventListener('scroll', function() {
      updateMinibar();
    });
  }

  // Enable scroll
  elt.style['touch-action'] = 'none';
  elt.style['overflow'] = 'hidden';
  elt.classList.add('ol-scrolldiv');

  // Start scrolling
  ol_ext_element_addListener(elt, ['pointerdown'], function(e) {
    isbar = false;
    onPointerDown(e)
  });

  // Prevet click when moving...
  elt.addEventListener('click', function(e) {
    if (elt.classList.contains('ol-move')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Stop scrolling
  let onPointerUp = function(e) {
    dt = new Date() - dt;
    if (dt>100 || isbar) {
      // User stop: no speed
      speed = 0;
    } else if (dt>0) {
      // Calculate new speed
      speed = ((speed||0) + (pos - e[page]) / dt) / 2;
    }
    animate(options.animate===false ? 0 : speed*200);
    pos = false;
    speed = 0;
    dt = 0;
    // Add class to handle click (on iframe / double-click)
    if (!elt.classList.contains('ol-move')) {
      elt.classList.add('ol-hasClick')
      setTimeout(function() { elt.classList.remove('ol-hasClick'); }, 500);
    } else {
      elt.classList.remove('ol-hasClick');
    }
    isbar = false;
    window.removeEventListener('pointermove', onPointerMove)
    ol_ext_element_removeListener(window, ['pointerup','pointercancel'], onPointerUp);
  };

  // Handle mousewheel
  let onMouseWheel = function(e) {
    // noinspection JSUnresolvedReference
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    elt.classList.add('ol-move');
    elt[scroll] -= delta*30;
    elt.classList.remove('ol-move');
    return false;
  }
  if (options.mousewheel) { // && !elt.classList.contains('ol-touch')) {
    ol_ext_element_addListener(elt,
      ['mousewheel', 'DOMMouseScroll', 'onmousewheel'],
      onMouseWheel
    );
  }

  return {
    refresh: updateMinibar
  }
}
