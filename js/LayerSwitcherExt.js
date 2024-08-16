/**----------------------------------------------------------------------------------------------------
 *	Copyright (c) 2015 Jean-Marc VIGLINO,
 *  released under the CeCILL-B license (French BSD license)
 *  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
 *
 *  Orginal from ol-ext, modified for FRESHEM.
 *
 *  First version, Adapted by Marco Duiker (OpenGeoGroep)
 *
 *  Modified: 2024, Eddy Scheper, OpenGeoGroep/ARIS BV
 *            - Redesign and cleanup.
 */

import Control from "ol/control/Control";
import {intersects} from "ol/extent";
import Heatmap from "ol/layer/Heatmap";
import Image from "ol/layer/Image";
import LayerGroup from "ol/layer/Group";
import Tile from "ol/layer/Tile";
import Vector from "ol/layer/Vector";
import VectorTile from "ol/layer/VectorTile";
import {unByKey} from "ol/Observable";
import {
  ol_ext_element_create, ol_ext_element_addListener, ol_ext_element_removeListener,
  ol_ext_element_getStyle, ol_ext_element_setStyle, ol_ext_element_hidden,
  ol_ext_element_outerHeight, ol_ext_element_hide, ol_ext_element_show,
  ol_ext_element_setHTML, ol_ext_element_scrollDiv
} from "./Utils";

export default class olLayerSwitcherExt extends Control {
  /**
   * Constructor.
   */
  constructor(options) {
    let element = ol_ext_element_create('DIV', {
      className: options.switcherClass || 'ol-layerswitcher'
    })
    super({
      element: element,
      target: options.target
    })

    let self = this
    this.dcount = 0
    this.show_progress = options.show_progress
    this.onInfo = (typeof (options.onInfo) === 'function' ? options.onInfo : null)
    this.onextent = (typeof (options.onextent) === 'function' ? options.onextent : null)
    this.hasextent = options.extent || options.onextent
    this.hastrash = options.trash
    this.reordering = (options.reordering !== false)
    this._layers = []
    this._layerGroup = (options.layerGroup && options.layerGroup.getLayers) ? options.layerGroup : null
    this.onChangeCheck = (typeof (options.onChangeCheck) === "function" ? options.onChangeCheck : null)

    // displayInLayerSwitcher
    if (typeof (options.displayInLayerSwitcher) === 'function') {
      this.displayInLayerSwitcher = options.displayInLayerSwitcher
    }

    // Insert in the map.
    if (!options.target) {
      element.classList.add('ol-unselectable')
      element.classList.add('ol-control')
      element.classList.add(options.collapsed !== false ? 'ol-collapsed' : 'ol-forceopen')

      //----------------------------------------------------------------------------------------
      // Add button.
      //----------------------------------------------------------------------------------------

      this.button = ol_ext_element_create('BUTTON', {
        type: 'button',
        parent: element,
        title: "Kaartlagen",
      })
      this.button.innerHTML = '<i class="fa fa-bars" aria-hidden="true"></i>';

      this.button.addEventListener('touchstart', function (e) {
        element.classList.toggle('ol-forceopen')
        element.classList.add('ol-collapsed')
        self.dispatchEvent({type: 'toggle', collapsed: element.classList.contains('ol-collapsed')})
        e.preventDefault()
        self.overflow(0)
      })
      this.button.addEventListener('click', function () {
        self.hideInfoPanel()
        element.classList.toggle('ol-forceopen')
        element.classList.add('ol-collapsed')
        self.dispatchEvent({type: 'toggle', collapsed: !element.classList.contains('ol-forceopen')})
        self.overflow(0)
      })

      if (options.mouseover) {
        element.addEventListener('mouseleave', function () {
          element.classList.add("ol-collapsed")
          self.dispatchEvent({type: 'toggle', collapsed: true})
        })
        element.addEventListener('mouseover', function () {
          element.classList.remove("ol-collapsed")
          self.dispatchEvent({type: 'toggle', collapsed: false})
        })
      }

      if (options.minibar)
        options.noScroll = true
      if (!options.noScroll) {
        this.topv = ol_ext_element_create('DIV', {
          className: 'ol-switchertopdiv',
          parent: element,
          click: function () {
            self.overflow("+50%")
          }
        })
        this.botv = ol_ext_element_create('DIV', {
          className: 'ol-switcherbottomdiv',
          parent: element,
          click: function () {
            self.overflow("-50%")
          }
        })
      }
      this._noScroll = options.noScroll
    }

    this.createPopup(element,options);

    // Handle mousewheel
    if (!options.target && !options.noScroll) {
      ol_ext_element_addListener(this.panel_, 'mousewheel DOMMouseScroll onmousewheel',
        // function (/** @type MouseWheelZoom */ e) {
        function (e) {
          //console.log("LayerSwitcherExt - Handle mousewheel")
          // noinspection JSUnresolvedReference
          if (self.overflow(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))))) {
            e.stopPropagation()
            e.preventDefault()
          }
        })
    }

    this.header_ = ol_ext_element_create('LI', {
      className: 'ol-header',
      parent: this.panel_
    })

    this.set('drawDelay', options.drawDelay || 0)
    this.set('selection', options.selection)

    if (options.minibar) {
      // Wait init complete (for child classes).
      setTimeout(function () {
        let mbar = ol_ext_element_scrollDiv(this.panelContainer_, {
          mousewheel: true,
          vertical: true,
          minibar: true
        })
        this.on(['drawlist', 'toggle'], function () {
          mbar.refresh()
        })
      }.bind(this))
    }
  }

  /** Clear layers associated with li
   * @private
   */
  _clearLayerForLI() {
    this._layers.forEach(function (li) {
      li.listeners.forEach(function (l) {
        unByKey(l)
      })
    })
    this._layers = []
  }

  /** Get the layer associated with a li
   * @param {Node} li
   * @return {Layer|LayerGroup}
   * @private
   */
  _getLayerForLI(li) {
    let i, len;
    for (i = 0, len = this._layers.length; i < len; i++) {
      if (this._layers[i].li === li) {
        return this._layers[i].layer;
      }
    }
    return null;
  }

  /** Set the layer associated with a li.
   * @param {Element} li
   * @param {Layer|LayerGroup} layer
   * @private
   */
  _setLayerForLI(li, layer) {
    let listeners = []
    //if (layer.getLayers) {
    if (layer instanceof LayerGroup) {
      listeners.push(layer.getLayers().on('change:length', this.drawPanel.bind(this)))
    }
    if (li) {
      // Handle opacity change
      listeners.push(layer.on('change:opacity', (function () {
        this.setLayerOpacity(layer, li)
      }).bind(this)))
      // Handle visibility chage
      listeners.push(layer.on('change:visible', (function () {
        this.setLayerVisibility(layer, li)
      }).bind(this)))
    }
    // Other properties
    listeners.push(layer.on('propertychange', (function (e) {
      if (e.key === 'displayInLayerSwitcher'
        || e.key === 'openInLayerSwitcher'
        || e.key === 'title'
        || e.key === 'name') {
        this.drawPanel(e)
      }
    }).bind(this)))
    this._layers.push({li: li, layer: layer, listeners: listeners})
  }

  /**
   * @param element
   * @param options
   */
  /**
   * @param element
   * Bijna OK
   */
  createPopup(element) {
    let infoPanel, infoBtnClose, infoContent;
    let layerPanel, containerPanel;

    // The info panel.
    infoPanel = ol_ext_element_create('DIV', {
      className: 'ol-layerswitcher-info',
    });

    // The close button.
    infoBtnClose = ol_ext_element_create('DIV', {
      className: 'ol-layerswitcher-info-content-close',
      html: "<i class='fa fa-times' aria-hidden='true'></i>",
    });
    $(infoBtnClose).click(function(){
      $(infoPanel).hide();
    });
    $(infoPanel).append(infoBtnClose);

    // The info content.
    infoContent = ol_ext_element_create('DIV', {
      className: 'ol-layerswitcher-info-content',
    });
    $(infoPanel).append(infoContent);

    // The layer panel.
    layerPanel = ol_ext_element_create('UL', {className: 'panel',});

    // The container panel.
    containerPanel = ol_ext_element_create('DIV', {
      className: 'panel-container',
      parent: element,
    })
    $(containerPanel).append(infoPanel);
    $(containerPanel).append(layerPanel);

    this.panel_ = layerPanel;
    this.panelContainer_ = containerPanel;
  }

  /** Creates the dimension slider.
   * @param parent
   * @param layer
   */
  createSliderDimension(parent, layer) {
    let self = this;

    //console.log("#LayerSwitcher.createSliderDimension()");

    // Slider.
    let dimensionElt = ol_ext_element_create('DIV', {
      className: 'layerswitcher-dimension layerswitcher-dimension-slider',
      // Click the slider line.
      click: function (e) {
        if (e.target !== this)
          return;
        e.stopPropagation();
        e.preventDefault();

        // Get the layer.
        let layer = self._getLayerForLI(this.parentNode.parentNode);
        if (!layer) {
          return;
        }

        // Get value from slider, between 0 and 1.
        let value = Math.max(0, Math.min(1, e.offsetX / ol_ext_element_getStyle(this, 'width')));

        //console.log("  Value - " + value);

        // Calculate dimension.
        let dimValue = self.sliderCalcDimFromValue(layer, value);

        //console.log("  dimValue - " + dimValue);

        // Update layer dimension.
        self.layerUpdateDimension(layer, dimValue);

        // Get slider handle.
        let elt = this.parentNode.querySelectorAll('.layerswitcher-dimension-cursor')[0];

        // Calculate snapped slider value.
        let snappedValue = self.sliderCalcValueFromDim(layer, dimValue);

        //console.log("  snappedValue - " + snappedValue);

        // Update slider handle position.
        self.sliderSetValue(elt, snappedValue);

        // Update label.
        self.sliderUpdateLabel(this, dimValue);
      },
      parent: parent
    })

    // Get dimension value from layer for slider.
    let sliderValue = self.layerDimensionGetSliderValue(layer);

    // Slider handler.
    ol_ext_element_create('DIV', {
      className: 'layerswitcher-dimension-cursor',
      style: {
        left: (sliderValue * parseInt($(".layerswitcher-dimension-slider").css("width")))
      },
      on: {
        'mousedown touchstart': function (e) {
          self.onDragDimension(e);
        }
      },
      parent: dimensionElt
    });

    // Add slider tickpanel.
    let tickPanel = ol_ext_element_create('DIV', {
      className: 'layerswitcher-dimension-tickpanel',
      parent: dimensionElt
    });

    // Add slider ticks.
    let dim = layer.get("dimension");
    let ticks = dim.ticks;
    let tickPercentages = self.layerDimensionGetTickPercentages(layer);
    for (let t = 0, len = ticks.length; t < len; t++) {
      ol_ext_element_create('DIV', {
        className: 'layerswitcher-dimension-tick',
        title: ticks[t],
        style: {
          marginLeft: tickPercentages[t]
        },
        parent: tickPanel
      });
    }

    // Get layer dimension.
    let dimValue = self.layerDimensionGetValue(layer);

    // Slider label.
    ol_ext_element_create('DIV', {
      className: 'layerswitcher-dimension-label',
      text: "" + dimValue,
      parent: parent
    })
  }

  /** Creates the opacity slider.
   * @param parent
   * @param layer
   */
  createSliderOpacity(parent, layer) {
    let self = this;

    // Slider.
    let opacityElt = ol_ext_element_create('DIV', {
      className: 'layerswitcher-opacity',
      // Click on the opacity line.
      click: function (e) {
        if (e.target !== this)
          return;
        e.stopPropagation();
        e.preventDefault();
        // Get layer.
        let layer = self._getLayerForLI(this.parentNode.parentNode);
        // Get value between 0 and 1.
        let value = Math.max(0, Math.min(1, e.offsetX / ol_ext_element_getStyle(this, 'width')));
        layer.setOpacity(value);
        // Get label.
        let label = this.parentNode.querySelectorAll('.layerswitcher-opacity-label')[0];
        label.innerHTML = "" + Math.round(value * 100);
      },
      parent: parent
    })
    // Slider handler.
    ol_ext_element_create('DIV', {
      className: 'layerswitcher-opacity-cursor ol-noscroll',
      style: {
        left: (layer.getOpacity() * 100) + "%"
      },
      on: {
        'mousedown touchstart': function (e) {
          self.onDragOpacity(e);
        }
      },
      parent: opacityElt
    })
    // Slider label.
    ol_ext_element_create('DIV', {
      className: 'layerswitcher-opacity-label',
      html: Math.round(layer.getOpacity() * 100),
      parent: parent
    })
  }

  /** Test if a layer should be displayed in the switcher
   * @param {Layer} layer
   * @return {boolean} true if the layer is displayed
   */
  displayInLayerSwitcher(layer) {
    return (layer.get('displayInLayerSwitcher') !== false)
  }

  /** Render a list of layer
   * @param {Element} ul element to render
   * @param {Collection} collection list of layer to show
   * @api stable
   * @private
   */
  drawList(ul, collection) {
    let self = this;
    let layers = collection.getArray();

    // Change layer visibility
    function setVisibility(e) {
      e.stopPropagation()
      e.preventDefault()
      let l = self._getLayerForLI(this.parentNode.parentNode)
      self.switchLayerVisibility(l, collection)
      if (self.get('selection') && l.getVisible()) {
        self.selectLayer(l)
      }
      if (self.onchangeCheck) {
        self.onchangeCheck(l)
      }
    }

    // Info button click
    function onInfo(e) {
      e.stopPropagation()
      e.preventDefault()
      let l = self._getLayerForLI(this.parentNode.parentNode)
      // Call onInfo callback.
      self.onInfo(l)
      self.dispatchEvent({type: "info", layer: l})
    }

    // Zoom to extent button
    function zoomExtent(e) {
      e.stopPropagation()
      e.preventDefault()
      let l = self._getLayerForLI(this.parentNode.parentNode)
      if (self.onextent) {
        self.onextent(l)
      } else {
        self.getMap().getView().fit(l.getExtent(), self.getMap().getSize())
      }
      self.dispatchEvent({type: "extent", layer: l})
    }

    // Remove a layer on trash click
    function removeLayer(e) {
      e.stopPropagation()
      e.preventDefault()
      let li = this.parentNode.parentNode.parentNode.parentNode
      let layer;
      let group = self._getLayerForLI(li)
      // Remove the layer from a group or from a map
      if (group) {
        layer = self._getLayerForLI(this.parentNode.parentNode)
        group.getLayers().remove(layer)
        if (group.getLayers().getLength() === 0 && !group.get('noSwitcherDelete')) {
          removeLayer.call(li.querySelectorAll('.layerTrash')[0], e)
        }
      } else {
        li = this.parentNode.parentNode
        self.getMap().removeLayer(self._getLayerForLI(li))
      }
    }

    // Create a list for a layer
    function createLi(layerSwitcher, layer) {

      if (!layerSwitcher.displayInLayerSwitcher(layer)) {
        layerSwitcher._setLayerForLI(null, layer);
        return;
      }

      let li = ol_ext_element_create('LI', {
        className: (layer.getVisible() ? "ol-visible " : " ") + (layer.get('baseLayer') ? "baselayer" : ""),
        parent: ul
      })
      layerSwitcher._setLayerForLI(li, layer)
      if (layerSwitcher._selectedLayer === layer) {
        li.classList.add('ol-layer-select')
      }

      let layer_buttons = ol_ext_element_create('DIV', {
        className: 'ol-layerswitcher-buttons',
        parent: li
      })

      // Content div
      let d = ol_ext_element_create('DIV', {
        className: 'li-content',
        parent: li
      })

      // Visibility
      ol_ext_element_create('INPUT', {
        type: layer.get('baseLayer') ? 'radio' : 'checkbox',
        className: 'ol-visibility',
        checked: layer.getVisible(),
        click: setVisibility,
        parent: d
      })
      // Label
      let label = ol_ext_element_create('LABEL', {
        title: layer.get('title') || layer.get('name'),
        click: setVisibility,
        style: {
          userSelect: 'none'
        },
        parent: d
      })
      label.addEventListener('selectstart', function () {
        return false
      })
      ol_ext_element_create('SPAN', {
        html: layer.get('title') || layer.get('name'),
        click: function (e) {
          if (layerSwitcher.get('selection')) {
            e.stopPropagation()
            layerSwitcher.selectLayer(layer)
          }
        }.bind(layerSwitcher),
        parent: label
      })

      // Up/down
      // if (layerSwitcher.reordering) {
      //     if ((i < layers.length - 1 && (layer.get("allwaysOnTop") || !layers[i + 1].get("allwaysOnTop")))
      //         || (i > 0 && (!layer.get("allwaysOnTop") || layers[i - 1].get("allwaysOnTop")))) {
      //         ol_ext_element_create('DIV', {
      //             className: 'layerup ol-noscroll',
      //             title: layerSwitcher.tip.up,
      //             on: { 'mousedown touchstart': function (e) { self.dragOrdering_(e) } },
      //             parent: layer_buttons
      //         })
      //     }
      // }

      // Show/hide sub layers
      if (layer.getLayers) {
        // GroupLayer.
        let nb = 0
        layer.getLayers().forEach(function (l) {
          if (self.displayInLayerSwitcher(l))
            nb++;
        })
        if (nb) {
          ol_ext_element_create('DIV', {
            className: layer.get("openInLayerSwitcher") ? "collapse-layers" : "expend-layers",
            title: layerSwitcher.tip.plus,
            click: function () {
              let l = self._getLayerForLI(this.parentNode.parentNode);
              l.set("openInLayerSwitcher", !l.get("openInLayerSwitcher"));
            },
            parent: layer_buttons
          })
        }
      }

      // Info button
      if (layerSwitcher.onInfo) {
        ol_ext_element_create('DIV', {
          className: 'layerInfo',
          title: layerSwitcher.tip.info,
          click: onInfo,
          parent: layer_buttons
        })
      }
      // Layer remove
      if (layerSwitcher.hastrash && !layer.get("noSwitcherDelete")) {
        ol_ext_element_create('DIV', {
          className: 'layerTrash',
          title: layerSwitcher.tip.trash,
          click: removeLayer,
          parent: layer_buttons
        })
      }
      // Layer extent
      // if (layerSwitcher.hasextent && layers[i].getExtent()) {
      //     let ex = layers[i].getExtent()
      //     if (ex.length === 4 && ex[0] < ex[2] && ex[1] < ex[3]) {
      //         ol_ext_element_create('DIV', {
      //             className: 'layerExtent',
      //             title: layerSwitcher.tip.extent,
      //             click: zoomExtent,
      //             parent: layer_buttons
      //         })
      //     }
      // }

      // Progress
      if (layerSwitcher.show_progress && layer instanceof Tile) {
        let p = ol_ext_element_create('DIV', {
          className: 'layerswitcher-progress',
          parent: d
        })
        layerSwitcher.setProgress_(layer)
        layer.layerswitcher_progress = ol_ext_element_create('DIV', {parent: p})
      }

      //-------------------------------------------------------------------------------------
      // Dimension
      //-------------------------------------------------------------------------------------

      let hasDimension = layer.get("dimension");
      if (hasDimension) {
        // Create dimension slider.
        layerSwitcher.createSliderDimension(d, layer);
      }

      //-------------------------------------------------------------------------------------
      // Opacity
      //-------------------------------------------------------------------------------------

      // Create opacity slider.
      layerSwitcher.createSliderOpacity(d, layer);

      // Layer group
      if (layer.getLayers) {
        li.classList.add('ol-layer-group')
        if (layer.get("openInLayerSwitcher") === true) {
          let ul2 = ol_ext_element_create('UL', {
            parent: li
          })
          layerSwitcher.drawList(ul2, layer.getLayers())
        }
      }
      li.classList.add(layerSwitcher.getLayerClass(layer))

      // Dispatch a dralist event to allow customisation
      layerSwitcher.dispatchEvent({type: 'drawlist', layer: layer, li: li})
    }

    // Add the layer list
    for (let i = layers.length - 1; i >= 0; i--) {
      createLi(self, layers[i])
    }

    self.viewChange();

    if (ul === self.panel_) {
      self.overflow(0);
    }
  }

  /** Draw the panel control (prevent multiple draw due to layers manipulation on the map with a delay function)
   * @api
   */
  drawPanel() {
    if (!this.getMap())
      return;
    let self = this;
    // Multiple event simultaneously / draw once => put drawing in the event queue.
    this.dcount++;
    setTimeout(function () {
      self.drawPanel_();
    }, this.get('drawDelay') || 0);
  }

  /** Delayed draw panel control
   * @private
   */
  drawPanel_() {
    if (--this.dcount || this.dragging_) {
      return
    }
    let scrollTop = this.panelContainer_.scrollTop;

    // Remove existing layers
    this._clearLayerForLI();
    this.panel_.querySelectorAll('li').forEach(function (li) {
      if (!li.classList.contains('ol-header'))
        li.remove();
    }.bind(this));
    // Draw list
    if (this._layerGroup) {
      this.drawList(this.panel_, this._layerGroup.getLayers());
    } else if (this.getMap()) {
      this.drawList(this.panel_, this.getMap().getLayers());
    }
    // Reset scrolltop
    this.panelContainer_.scrollTop = scrollTop;
  }

  /** Select a layer
   * @param {Layer} layer
   * @returns {string} the layer classname
   * @api
   */
  getLayerClass(layer) {
    if (!layer)
      return 'none'
    if (layer instanceof LayerGroup)
      return 'ol-layer-group'
    if (layer instanceof Vector)
      return 'ol-layer-vector'
    if (layer instanceof VectorTile)
      return 'ol-layer-vectortile'
    if (layer instanceof Tile)
      return 'ol-layer-tile'
    if (layer instanceof Image)
      return 'ol-layer-image'
    if (layer instanceof Heatmap)
      return 'ol-layer-heatmap'
    /* ol < 6 compatibility VectorImage is not defined */
    // if (layer instanceof ol_layer_VectorImage) return 'ol-layer-vectorimage';
    if (layer.getFeatures)
      return 'ol-layer-vectorimage'
    return 'unknown'
  }

  /** Get control panel
   * @api
   */
  getPanel() {
    return this.panelContainer_
  }

  /** Get selected layer
   * @returns {ol.layer.Layer}
   */
  getSelection() {
    return this._selectedLayer
  }

  /** Hide control
   */
  hide() {
    this.element.classList.remove('ol-forceopen')
    this.overflow(0)
    this.dispatchEvent({type: 'toggle', collapsed: true})
  }

  /** Hide info panel
   */
  hideInfoPanel() {
    let infoPanel;
    infoPanel = $(".ol-layerswitcher-info");
    infoPanel.hide();
  }

  /** Is control open
   * @return {boolean}
   */
  isOpen() {
    return this.element.classList.contains("ol-forceopen")
  }

  /**
   * @param {Layer} layer
   */
  layerDimensionGetValue(layer) {
    let dim = layer.get("dimension");
    return layer.getSource().getParams()[dim.name];
  }

  /**
   * @param {Layer} layer
   */
  layerDimensionGetSliderValue(layer) {
    let value;
    let dim = layer.get("dimension");
    let dimValue = layer.getSource().getParams()[dim.name];
    if (dim.scaling && dim.scaling === 'count') {
      value = dim.list.indexOf(dimValue) / (dim.list.length - 1);
    } else {
      value = Math.abs((dimValue - dim.list[0]) / (dim.list[dim.list.length - 1] - dim.list[0]));
    }
    return value
  }

  /**
   * @param {Layer} layer
   */
  layerDimensionGetTickPercentages(layer) {
    let dim, delta, perc, nrTicks;
    let percentages = [];
    dim = layer.get("dimension");
    nrTicks = dim.ticks.length;
    percentages.push("0%");
    delta = 100 / (nrTicks - 1);
    perc = delta;
    for (let t = 0, len = nrTicks - 1; t < len; t++) {
      percentages.push(perc.toString() + "%");
      perc += delta;
    }
    return percentages;
  }

  /**
   * @param {Layer} layer
   * @param {float} dimValue
   */
  layerUpdateDimension(layer, dimValue) {
    let dim = layer.get("dimension");
    let params = {};
    console.log("#LayerSwitcher.layerUpdateDimension()");
    // console.log(layer);
    // console.log(layer.get("title"));
    // console.log(layer.get("fid"));

    let fid = layer.get("fid");
    if (fid.includes("suit_extraction")) {
      // Convert to centimeter.
      params[dim.name] = Math.trunc(dimValue * 100);
    } else {
      params[dim.name] = dimValue;
    }

    layer.getSource().updateParams(params);
  }

  /** Change dimension parameter on drag
   * Aanroep in: createSliderDimension()
   *  @param {MouseEvent|TouchEvent} e drag event
   *  @private
   */
  onDragDimension(e) {
    let self = this;

    // console.log("onDragDimension");
    // console.log(e);

    e.stopPropagation();
    e.preventDefault();

    // Register start params.
    let elt = e.target;
    let layer = self._getLayerForLI(elt.parentNode.parentNode.parentNode);
    if (!layer)
      return;
    let x = e.pageX
      || (e.touches && e.touches.length && e.touches[0].pageX)
      || (e.changedTouches && e.changedTouches.length && e.changedTouches[0].pageX);
    // Is used in 'move'!
    let start = ol_ext_element_getStyle(elt, 'left') - x;
    self.dragging_ = true;

    function sliderCalcDimFromValue(layer, value) {
      let index;
      let dimValue;
      let dim = layer.get("dimension");
      let list = dim.list.slice();
      if (dim.scaling && dim.scaling === 'count') {
        // Get value from distance and lower and upper value in list.
        index = Math.floor((dim.list.length) * value);
        index = index > dim.list.length - 1 ? dim.list.length - 1 : index;
        dimValue = dim.list[index];
      } else {
        index = (dim.list[dim.list.length - 1] - dim.list[0]) * value + dim.list[0];
        // Snap the value to the closest value in the list.
        dimValue = list.sort(function (a, b) {
          return Math.abs(index - a) - Math.abs(index - b);
        })[0];
      }
      return dimValue;
    }

    function sliderSetValue(elt, value) {
      // Set de handle positie.
      ol_ext_element_setStyle(elt, {left: (value * 100) + "%"});
    }

    function labelSetValue(elt, value) {
      // Set de label text.
      elt.parentNode.nextElementSibling.innerHTML = "" + value;
    }

    // stop dragging
    function stop() {
      console.log("onDragDimension - stop");

      ol_ext_element_removeListener(document, "mouseup touchend touchcancel", stop);
      ol_ext_element_removeListener(document, "mousemove touchmove", move);

      console.log(elt);                 // knop

      let left = ol_ext_element_getStyle(elt, 'left');
      console.log("elt left " + left);

      let width = ol_ext_element_getStyle(elt.parentNode, 'width');
      console.log("slider width " + width);
      let value = Math.max(0, Math.min(1, left / width));
      console.log("value " + value);

      // Calculate dimension.
      let dimValue = sliderCalcDimFromValue(layer, value);

      console.log("  dimValue - " + dimValue);

      // Update layer dimension.
      self.layerUpdateDimension(layer, dimValue);

      // Calculate snapped slider value.
      let snappedValue = self.sliderCalcValueFromDim(layer, dimValue);

      console.log("  snappedValue - " + snappedValue);

      // Update slider handle position.
      sliderSetValue(elt, snappedValue);

      // Update label.
      labelSetValue(elt, dimValue);

      self.dragging_ = false;
    }

    // On draggin
    function move(e) {
      let x = e.pageX ||
        (e.touches && e.touches.length && e.touches[0].pageX) ||
        (e.changedTouches && e.changedTouches.length && e.changedTouches[0].pageX);
      let delta = (start + x) / ol_ext_element_getStyle(elt.parentNode, 'width');
      let value = Math.max(0, Math.min(1, delta));
      ol_ext_element_setStyle(elt, {left: (value * 100) + "%"});
      let dimValue = sliderCalcDimFromValue(layer, value);
      //console.log("move - value/dimvalue - " + value + " " + dimValue);
      elt.parentNode.nextElementSibling.innerHTML = "" + dimValue;
    }

    // Register move and stop.
    ol_ext_element_addListener(document, "mouseup touchend touchcancel", stop);
    ol_ext_element_addListener(document, "mousemove touchmove", move);

  }

  /** Change opacity on drag
   *  @param {MouseEvent|TouchEvent} e drag event
   *  @private
   */
  onDragOpacity(e) {
    let self = this;
    e.stopPropagation();
    e.preventDefault();
    // Register start params
    let elt = e.target;
    let layer = self._getLayerForLI(elt.parentNode.parentNode.parentNode);
    if (!layer)
      return;
    let x = e.pageX
      || (e.touches && e.touches.length && e.touches[0].pageX)
      || (e.changedTouches && e.changedTouches.length && e.changedTouches[0].pageX);
    // Wordt in move gebruikt!
    let start = ol_ext_element_getStyle(elt, 'left') - x;
    self.dragging_ = true;

    // stop dragging
    function stop() {
      ol_ext_element_removeListener(document, "mouseup touchend touchcancel", stop);
      ol_ext_element_removeListener(document, "mousemove touchmove", move);
      self.dragging_ = false;
    }

    // On draggin
    function move(e) {
      let x = e.pageX ||
        (e.touches && e.touches.length && e.touches[0].pageX) ||
        (e.changedTouches && e.changedTouches.length && e.changedTouches[0].pageX);
      let delta = (start + x) / ol_ext_element_getStyle(elt.parentNode, 'width');
      let opacity = Math.max(0, Math.min(1, delta));
      ol_ext_element_setStyle(elt, {left: (opacity * 100) + "%"});
      elt.parentNode.nextElementSibling.innerHTML = "" + Math.round(opacity * 100);
      layer.setOpacity(opacity);
    }

    // Register move and stop.
    ol_ext_element_addListener(document, "mouseup touchend touchcancel", stop);
    ol_ext_element_addListener(document, "mousemove touchmove", move);
  }

  /** Calculate overflow and add scrolls
   * @param {Number|String} dir scroll direction -1|0|1|'+50%'|'-50%'
   * @private
   */
  overflow(dir) {
    if (this.button && !this._noScroll) {
      // Nothing to show
      if (ol_ext_element_hidden(this.panel_)) {
        ol_ext_element_setStyle(this.element, {height: 'auto'})
        return
      }
      // Calculate offset
      let h = ol_ext_element_outerHeight(this.element)
      let hp = ol_ext_element_outerHeight(this.panel_)
      let dh = this.button.offsetTop + ol_ext_element_outerHeight(this.button)
      //let dh = this.button.position().top + this.button.outerHeight(true);
      let top = this.panel_.offsetTop - dh
      if (hp > h - dh) {
        // Bug IE: need to have an height defined
        ol_ext_element_setStyle(this.element, {height: '100%'})
        let li = this.panel_.querySelectorAll('li.ol-visible .li-content')[0]
        let lh = li ? 2 * ol_ext_element_getStyle(li, 'height') : 0
        switch (dir) {
          case 1:
            top += lh;
            break
          case -1:
            top -= lh;
            break
          case "+50%":
            top += Math.round(h / 2);
            break
          case "-50%":
            top -= Math.round(h / 2);
            break
          default:
            break
        }
        // Scroll div
        if (top + hp <= h - 3 * dh / 2) {
          top = h - 3 * dh / 2 - hp
          ol_ext_element_hide(this.botv)
        } else {
          ol_ext_element_show(this.botv)
        }
        if (top >= 0) {
          top = 0
          ol_ext_element_hide(this.topv)
        } else {
          ol_ext_element_show(this.topv)
        }
        // Scroll ?
        ol_ext_element_setStyle(this.panel_, {top: top + "px"})
        return true
      } else {
        ol_ext_element_setStyle(this.element, {height: "auto"})
        ol_ext_element_setStyle(this.panel_, {top: 0})
        ol_ext_element_hide(this.botv)
        ol_ext_element_hide(this.topv)
        return false
      }
    } else
      return false
  }

  /** Select a layer
   * @param {ol.layer.Layer} layer
   * @param {boolean} silent
   * @api
   */
  selectLayer(layer, silent) {
    if (!layer) {
      if (!this.getMap())
        return
      layer = this.getMap().getLayers().item(this.getMap().getLayers().getLength() - 1)
    }
    this._selectedLayer = layer
    this.drawPanel()
    if (!silent)
      this.dispatchEvent({type: 'select', layer: layer})
  }

  /** Add a custom header
   * @param {Element|string} html content html
   */
  setHeader(html) {
    ol_ext_element_setHTML(this.header_, html)
  }

  /** Set opacity for a layer
   * @param {Layer} layer
   * @param {Element} li the list element
   * @private
   */
  setLayerOpacity(layer, li) {
    let i = li.querySelector('.layerswitcher-opacity-cursor')
    if (i) {
      i.style.left = (layer.getOpacity() * 100) + "%"
    }
    this.dispatchEvent({type: 'layer:opacity', layer: layer})
  }

  /** Set visibility for a layer
   * @param {Layer} layer
   * @param {Element} li the list element
   * @api
   */
  setLayerVisibility(layer, li) {
    let fid,dim,dimValue,params;
    let i;
    console.log("#LayerSwitcher.setLayerVisibility()");

    // console.log("fid: " + fid);
    // if (fid.includes("suit_extraction")) {
    //   let dimValue = -20.25;
    //   console.log("  dimValue - " + dimValue);
    //   // Update layer dimension.
    //   this.layerUpdateDimension(layer, dimValue);
    // }

    i = li.querySelector('.ol-visibility')
    if (i) {
      i.checked = layer.getVisible()
    }
    if (layer.getVisible()) {
      li.classList.add('ol-visible');

      // 20240614
      // Set proper dimension value  of suit_extraction at first use.
      fid = layer.get("fid");
      if (fid.includes("suit_extraction")) {
        dim = layer.get("dimension");
        // First usage?
        if (dim.initialValue) {
          dimValue = dim.initialValue
          console.log("  dimValue - " + dimValue);
          this.layerUpdateDimension(layer, dimValue);
          dim.initialValue = null;
          layer.set("dimension",dim);
        }
      }
    } else {
      li.classList.remove('ol-visible');
    }
    this.dispatchEvent({type: 'layer:visible', layer: layer})
  }

  /**
   * Set the map instance the control is associated with.
   * @param {Map} map The map instance.
   */
  setMap(map) {
    super.setMap(map)
    this.drawPanel()

    if (this._listener) {
      for (let i in this._listener) {
        //ol_Observable_unByKey(this._listener[i])
        unByKey(this._listener[i])
      }
    }
    this._listener = null

    // Get change (new layer added or removed)
    if (map) {
      this._listener = {
        moveend: map.on('moveend', this.viewChange.bind(this)),
        size: map.on('change:size', this.overflow.bind(this))
      }
      // Listen to a layer group
      if (this._layerGroup) {
        this._listener.change = this._layerGroup.getLayers().on('change:length', this.drawPanel.bind(this))
      } else {
        //Listen to all layers
        this._listener.change = map.getLayerGroup().getLayers().on('change:length', this.drawPanel.bind(this))
      }
    }
  }

  /** Handle progress bar for a layer
   *  @private
   */
  setProgress_(layer) {
    if (!layer.layerswitcher_progress) {
      let loaded = 0
      let loading = 0
      let draw = function () {
        if (loading === loaded) {
          loading = loaded = 0
          ol_ext_element_setStyle(layer.layerswitcher_progress, {width: 0}) // layer.layerswitcher_progress.width(0);
        } else {
          ol_ext_element_setStyle(layer.layerswitcher_progress, {width: (loaded / loading * 100).toFixed(1) + '%'}) // layer.layerswitcher_progress.css('width', (loaded / loading * 100).toFixed(1) + '%');
        }
      }
      layer.getSource().on('tileloadstart', function () {
        loading++
        draw()
      })
      layer.getSource().on('tileloadend', function () {
        loaded++
        draw()
      })
      layer.getSource().on('tileloaderror', function () {
        loaded++
        draw()
      })
    }
  }

  /** Show control
   */
  show() {
    this.element.classList.add('ol-forceopen')
    this.overflow(0)
    this.dispatchEvent({type: 'toggle', collapsed: false})
  }

  /** Calculates the slider value (snapped) from the dimension value.
   */
  sliderCalcValueFromDim(layer, dimValue) {
    let value;
    let dim = layer.get("dimension");
    if (dim.scaling && dim.scaling === 'count') {
      value = dim.list.indexOf(dimValue) / (dim.list.length - 1);
    } else {
      value = Math.abs((dimValue - dim.list[0]) / (dim.list[dim.list.length - 1] - dim.list[0]));
    }
    return value;
  }

  /** Calculates the dimension value from the slider value.
   */
  sliderCalcDimFromValue(layer, value) {
    let index;
    let dimValue;
    let dim = layer.get("dimension");
    let list = dim.list.slice();
    if (dim.scaling && dim.scaling === 'count') {
      // Get value from distance and lower and upper value in list.
      index = Math.floor((dim.list.length) * value);
      index = index > dim.list.length - 1 ? dim.list.length - 1 : index;
      dimValue = dim.list[index];
    } else {
      index = (dim.list[dim.list.length - 1] - dim.list[0]) * value + dim.list[0];
      // Snap the value to the closest value in the list.
      dimValue = list.sort(function (a, b) {
        return Math.abs(index - a) - Math.abs(index - b);
      })[0];
    }
    return dimValue;
  }

  /**
   */
  sliderSetValue(elt, value) {
    ol_ext_element_setStyle(elt, {left: (value * 100) + "%"});
  }

  /**
   */
  sliderUpdateLabel(elt, text) {
    let label = elt.parentNode.querySelectorAll('.layerswitcher-dimension-label')[0];
    label.innerHTML = "" + text;
  }

  /** Change layer visibility according to the baselayer option
   * @param {Layer} l layer
   * @param {Array<Layer>} layers related layers
   * @private
   */
  switchLayerVisibility(l, layers) {
    if (!l.get('baseLayer')) {
      l.setVisible(!l.getVisible())
    } else {
      if (!l.getVisible()) {
        l.setVisible(true)
      }
      layers.forEach(function (li) {
        if (l !== li && li.get('baseLayer') && li.getVisible()) {
          li.setVisible(false)
        }
      })
    }
  }

  /** Check if layer is on the map (depending on resolution / zoom and extent)
   * @param {Layer} layer
   * @return {boolean}
   * @private
   */
  testLayerVisibility(layer) {
    if (!this.getMap())
      return true
    let res = this.getMap().getView().getResolution()
    let zoom = this.getMap().getView().getZoom()
    // Calculate visibility on resolution or zoom
    if (layer.getMaxResolution() <= res || layer.getMinResolution() >= res) {
      return false
    } else if (layer.getMinZoom && (layer.getMinZoom() >= zoom || layer.getMaxZoom() < zoom)) {
      return false
    } else {
      // Check extent
      let ex0 = layer.getExtent()
      if (ex0) {
        let ex = this.getMap().getView().calculateExtent(this.getMap().getSize())
        return intersects(ex, ex0)
      }
      return true
    }
  }

  /** Toggle control
   */
  toggle() {
    this.element.classList.toggle("ol-forceopen")
    this.overflow(0)
    this.dispatchEvent({type: 'toggle', collapsed: !this.isOpen()})
  }

  /**
   * On view change hide layer depending on resolution / extent
   * @private
   */
  viewChange() {
    this.panel_.querySelectorAll('li').forEach(function (li) {
      let l = this._getLayerForLI(li)
      if (l) {
        if (this.testLayerVisibility(l)) {
          li.classList.remove('ol-layer-hidden')
        } else {
          li.classList.add('ol-layer-hidden')
        }
      }
    }.bind(this))
  }
}

/** List of tips
 */
olLayerSwitcherExt.prototype.tip = {
  up: "Verplaatsen",
  down: "Naar beneden",
  info: "Meer informatie",
  extent: "Zoom naar extent",
  trash: "Verwijder laag",
  plus: "In-/uitklappen"
};
