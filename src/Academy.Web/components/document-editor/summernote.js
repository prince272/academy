import $ from 'jquery';

import 'summernote/dist/summernote-lite.css';

import 'summernote/src/js/base/summernote-en-US';
import 'summernote/src/js/summernote';
import dom from 'summernote/src/js/base/core/dom';
import range from 'summernote/src/js/base/core/range';
import lists from 'summernote/src/js/base/core/lists';
import func from 'summernote/src/js/base/core/func';
import env from 'summernote/src/js/base/core/env';

import Editor from 'summernote/src/js/base/module/Editor';
import Clipboard from 'summernote/src/js/base/module/Clipboard';
import Dropzone from 'summernote/src/js/base/module/Dropzone';
import Codeview from 'summernote/src/js/base/module/Codeview';
import Statusbar from 'summernote/src/js/base/module/Statusbar';
import Fullscreen from 'summernote/src/js/base/module/Fullscreen';
import Handle from 'summernote/src/js/base/module/Handle';
import AutoLink from 'summernote/src/js/base/module/AutoLink';
import AutoSync from 'summernote/src/js/base/module/AutoSync';
import AutoReplace from 'summernote/src/js/base/module/AutoReplace';
import Placeholder from 'summernote/src/js/base/module/Placeholder';

class Buttons {
  constructor(context) {
    this.ui = $.summernote.ui;
    this.context = context;
    this.$toolbar = context.layoutInfo.toolbar;
    this.options = context.options;
    this.lang = this.options.langInfo;
    this.invertedKeyMap = func.invertObject(
      this.options.keyMap[env.isMac ? 'mac' : 'pc']
    );
  }

  representShortcut(editorMethod) {
    let shortcut = this.invertedKeyMap[editorMethod];
    if (!this.options.shortcuts || !shortcut) {
      return '';
    }

    if (env.isMac) {
      shortcut = shortcut.replace('CMD', '⌘').replace('SHIFT', '⇧');
    }

    shortcut = shortcut.replace('BACKSLASH', '\\')
      .replace('SLASH', '/')
      .replace('LEFTBRACKET', '[')
      .replace('RIGHTBRACKET', ']');

    return ' (' + shortcut + ')';
  }

  button(o) {
    if (!this.options.tooltip && o.tooltip) {
      delete o.tooltip;
    }
    o.container = this.options.container;
    return this.ui.button(o);
  }

  initialize() {
    this.addToolbarButtons();
    this.addImagePopoverButtons();
    this.addLinkPopoverButtons();
    this.addTablePopoverButtons();
    this.fontInstalledMap = {};
  }

  destroy() {
    delete this.fontInstalledMap;
  }

  isFontInstalled(name) {
    if (!Object.prototype.hasOwnProperty.call(this.fontInstalledMap, name)) {
      this.fontInstalledMap[name] = env.isFontInstalled(name) ||
        lists.contains(this.options.fontNamesIgnoreCheck, name);
    }
    return this.fontInstalledMap[name];
  }

  isFontDeservedToAdd(name) {
    name = name.toLowerCase();
    return (name !== '' && this.isFontInstalled(name) && env.genericFontFamilies.indexOf(name) === -1);
  }

  colorPalette(className, tooltip, backColor, foreColor) {
    return this.ui.buttonGroup({
      className: 'note-color ' + className,
      children: [
        this.button({
          className: 'note-current-color-button',
          contents: this.ui.icon(this.options.icons.font + ' note-recent-color'),
          tooltip: this.lang.color.more,
          data: {
            toggle: 'dropdown',
          },
          callback: ($button) => {
            const $recentColor = $button.find('.note-recent-color');
            if (backColor) {
              $recentColor.css('background-color', this.options.colorButton.backColor);
              $button.attr('data-backColor', this.options.colorButton.backColor);
            }
            if (foreColor) {
              $recentColor.css('color', this.options.colorButton.foreColor);
              $button.attr('data-foreColor', this.options.colorButton.foreColor);
            } else {
              $recentColor.css('color', 'transparent');
            }
          },
        }),
        this.ui.dropdown({
          items: (backColor ? [
            '<div class="note-palette">',
            '<div class="note-palette-title">' + this.lang.color.background + '</div>',
            '<div>',
            '<button type="button" class="note-color-reset btn btn-light btn-default" data-event="backColor" data-value="transparent">',
            this.lang.color.transparent,
            '</button>',
            '</div>',
            '<div class="note-holder" data-event="backColor"><!-- back colors --></div>',
            '<div>',
            '<button type="button" class="note-color-select btn btn-light btn-default" data-event="openPalette" data-value="backColorPicker">',
            this.lang.color.cpSelect,
            '</button>',
            '<input type="color" id="backColorPicker" class="note-btn note-color-select-btn" value="' + this.options.colorButton.backColor + '" data-event="backColorPalette">',
            '</div>',
            '<div class="note-holder-custom" id="backColorPalette" data-event="backColor"></div>',
            '</div>',
          ].join('') : '') +
            (foreColor ? [
              '<div class="note-palette">',
              '<div class="note-palette-title">' + this.lang.color.foreground + '</div>',
              '<div>',
              '<button type="button" class="note-color-reset btn btn-light btn-default" data-event="removeFormat" data-value="foreColor">',
              this.lang.color.resetToDefault,
              '</button>',
              '</div>',
              '<div class="note-holder" data-event="foreColor"><!-- fore colors --></div>',
              '<div>',
              '<button type="button" class="note-color-select btn btn-light btn-default" data-event="openPalette" data-value="foreColorPicker">',
              this.lang.color.cpSelect,
              '</button>',
              '<input type="color" id="foreColorPicker" class="note-btn note-color-select-btn" value="' + this.options.colorButton.foreColor + '" data-event="foreColorPalette">',
              '</div>', // Fix missing Div, Commented to find easily if it's wrong
              '<div class="note-holder-custom" id="foreColorPalette" data-event="foreColor"></div>',
              '</div>',
            ].join('') : ''),
          callback: ($dropdown) => {
            $dropdown.find('.note-holder').each((idx, item) => {
              const $holder = $(item);
              $holder.append(this.ui.palette({
                colors: this.options.colors,
                colorsName: this.options.colorsName,
                eventName: $holder.data('event'),
                container: this.options.container,
                tooltip: this.options.tooltip,
              }).render());
            });
            /* TODO: do we have to record recent custom colors within cookies? */
            var customColors = [
              ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
            ];
            $dropdown.find('.note-holder-custom').each((idx, item) => {
              const $holder = $(item);
              $holder.append(this.ui.palette({
                colors: customColors,
                colorsName: customColors,
                eventName: $holder.data('event'),
                container: this.options.container,
                tooltip: this.options.tooltip,
              }).render());
            });
            $dropdown.find('input[type=color]').each((idx, item) => {
              $(item).change(function () {
                const $chip = $dropdown.find('#' + $(this).data('event')).find('.note-color-btn').first();
                const color = this.value.toUpperCase();
                $chip.css('background-color', color)
                  .attr('aria-label', color)
                  .attr('data-value', color)
                  .attr('data-original-title', color);
                $chip.click();
              });
            });
          },
          click: (event) => {
            event.stopPropagation();

            const $parent = $('.' + className).find('.note-dropdown-menu');
            const $button = $(event.target);
            const eventName = $button.data('event');
            const value = $button.attr('data-value');

            if (eventName === 'openPalette') {
              const $picker = $parent.find('#' + value);
              const $palette = $($parent.find('#' + $picker.data('event')).find('.note-color-row')[0]);

              // Shift palette chips
              const $chip = $palette.find('.note-color-btn').last().detach();

              // Set chip attributes
              const color = $picker.val();
              $chip.css('background-color', color)
                .attr('aria-label', color)
                .attr('data-value', color)
                .attr('data-original-title', color);
              $palette.prepend($chip);
              $picker.click();
            } else {
              if (lists.contains(['backColor', 'foreColor'], eventName)) {
                const key = eventName === 'backColor' ? 'background-color' : 'color';
                const $color = $button.closest('.note-color').find('.note-recent-color');
                const $currentButton = $button.closest('.note-color').find('.note-current-color-button');

                $color.css(key, value);
                $currentButton.attr('data-' + eventName, value);
              }
              this.context.invoke('editor.' + eventName, value);
            }
          },
        }),
      ],
    }).render();
  }

  addToolbarButtons() {
    this.context.memo('button.style', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents(
            this.ui.icon(this.options.icons.magic), this.options
          ),
          tooltip: this.lang.style.style,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown({
          className: 'dropdown-style',
          items: this.options.styleTags,
          title: this.lang.style.style,
          template: (item) => {
            // TBD: need to be simplified
            if (typeof item === 'string') {
              item = {
                tag: item,
                title: (Object.prototype.hasOwnProperty.call(this.lang.style, item) ? this.lang.style[item] : item),
              };
            }

            const tag = item.tag;
            const title = item.title;
            const style = item.style ? ' style="' + item.style + '" ' : '';
            const className = item.className ? ' class="' + item.className + '"' : '';

            return '<' + tag + style + className + '>' + title + '</' + tag + '>';
          },
          click: this.context.createInvokeHandler('editor.formatBlock'),
        }),
      ]).render();
    });

    for (let styleIdx = 0, styleLen = this.options.styleTags.length; styleIdx < styleLen; styleIdx++) {
      const item = this.options.styleTags[styleIdx];

      this.context.memo('button.style.' + item, () => {
        return this.button({
          className: 'note-btn-style-' + item,
          contents: '<div data-value="' + item + '">' + item.toUpperCase() + '</div>',
          tooltip: this.lang.style[item],
          click: this.context.createInvokeHandler('editor.formatBlock'),
        }).render();
      });
    }

    this.context.memo('button.bold', () => {
      return this.button({
        className: 'note-btn-bold',
        contents: this.ui.icon(this.options.icons.bold),
        tooltip: this.lang.font.bold + this.representShortcut('bold'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.bold'),
      }).render();
    });

    this.context.memo('button.italic', () => {
      return this.button({
        className: 'note-btn-italic',
        contents: this.ui.icon(this.options.icons.italic),
        tooltip: this.lang.font.italic + this.representShortcut('italic'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.italic'),
      }).render();
    });

    this.context.memo('button.underline', () => {
      return this.button({
        className: 'note-btn-underline',
        contents: this.ui.icon(this.options.icons.underline),
        tooltip: this.lang.font.underline + this.representShortcut('underline'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.underline'),
      }).render();
    });

    this.context.memo('button.clear', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.eraser),
        tooltip: this.lang.font.clear + this.representShortcut('removeFormat'),
        click: this.context.createInvokeHandler('editor.removeFormat'),
      }).render();
    });

    this.context.memo('button.strikethrough', () => {
      return this.button({
        className: 'note-btn-strikethrough',
        contents: this.ui.icon(this.options.icons.strikethrough),
        tooltip: this.lang.font.strikethrough + this.representShortcut('strikethrough'),
        click: this.context.createInvokeHandlerAndUpdateState('editor.strikethrough'),
      }).render();
    });

    this.context.memo('button.superscript', () => {
      return this.button({
        className: 'note-btn-superscript',
        contents: this.ui.icon(this.options.icons.superscript),
        tooltip: this.lang.font.superscript,
        click: this.context.createInvokeHandlerAndUpdateState('editor.superscript'),
      }).render();
    });

    this.context.memo('button.subscript', () => {
      return this.button({
        className: 'note-btn-subscript',
        contents: this.ui.icon(this.options.icons.subscript),
        tooltip: this.lang.font.subscript,
        click: this.context.createInvokeHandlerAndUpdateState('editor.subscript'),
      }).render();
    });

    this.context.memo('button.fontname', () => {
      const styleInfo = this.context.invoke('editor.currentStyle');

      if (this.options.addDefaultFonts) {
        // Add 'default' fonts into the fontnames array if not exist
        $.each(styleInfo['font-family'].split(','), (idx, fontname) => {
          fontname = fontname.trim().replace(/['"]+/g, '');
          if (this.isFontDeservedToAdd(fontname)) {
            if (this.options.fontNames.indexOf(fontname) === -1) {
              this.options.fontNames.push(fontname);
            }
          }
        });
      }

      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents(
            '<span class="note-current-fontname"></span>', this.options
          ),
          tooltip: this.lang.font.name,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontname',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontNames.filter(this.isFontInstalled.bind(this)),
          title: this.lang.font.name,
          template: (item) => {
            return '<span style="font-family: ' + env.validFontName(item) + '">' + item + '</span>';
          },
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontName'),
        }),
      ]).render();
    });

    this.context.memo('button.fontsize', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents('<span class="note-current-fontsize"></span>', this.options),
          tooltip: this.lang.font.size,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontsize',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontSizes,
          title: this.lang.font.size,
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontSize'),
        }),
      ]).render();
    });

    this.context.memo('button.fontsizeunit', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents('<span class="note-current-fontsizeunit"></span>', this.options),
          tooltip: this.lang.font.sizeunit,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          className: 'dropdown-fontsizeunit',
          checkClassName: this.options.icons.menuCheck,
          items: this.options.fontSizeUnits,
          title: this.lang.font.sizeunit,
          click: this.context.createInvokeHandlerAndUpdateState('editor.fontSizeUnit'),
        }),
      ]).render();
    });

    this.context.memo('button.color', () => {
      return this.colorPalette('note-color-all', this.lang.color.recent, true, true);
    });

    this.context.memo('button.forecolor', () => {
      return this.colorPalette('note-color-fore', this.lang.color.foreground, false, true);
    });

    this.context.memo('button.backcolor', () => {
      return this.colorPalette('note-color-back', this.lang.color.background, true, false);
    });

    this.context.memo('button.ul', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.unorderedlist),
        tooltip: this.lang.lists.unordered + this.representShortcut('insertUnorderedList'),
        click: this.context.createInvokeHandler('editor.insertUnorderedList'),
      }).render();
    });

    this.context.memo('button.ol', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.orderedlist),
        tooltip: this.lang.lists.ordered + this.representShortcut('insertOrderedList'),
        click: this.context.createInvokeHandler('editor.insertOrderedList'),
      }).render();
    });

    const justifyLeft = this.button({
      contents: this.ui.icon(this.options.icons.alignLeft),
      tooltip: this.lang.paragraph.left + this.representShortcut('justifyLeft'),
      click: this.context.createInvokeHandler('editor.justifyLeft'),
    });

    const justifyCenter = this.button({
      contents: this.ui.icon(this.options.icons.alignCenter),
      tooltip: this.lang.paragraph.center + this.representShortcut('justifyCenter'),
      click: this.context.createInvokeHandler('editor.justifyCenter'),
    });

    const justifyRight = this.button({
      contents: this.ui.icon(this.options.icons.alignRight),
      tooltip: this.lang.paragraph.right + this.representShortcut('justifyRight'),
      click: this.context.createInvokeHandler('editor.justifyRight'),
    });

    const justifyFull = this.button({
      contents: this.ui.icon(this.options.icons.alignJustify),
      tooltip: this.lang.paragraph.justify + this.representShortcut('justifyFull'),
      click: this.context.createInvokeHandler('editor.justifyFull'),
    });

    const outdent = this.button({
      contents: this.ui.icon(this.options.icons.outdent),
      tooltip: this.lang.paragraph.outdent + this.representShortcut('outdent'),
      click: this.context.createInvokeHandler('editor.outdent'),
    });

    const indent = this.button({
      contents: this.ui.icon(this.options.icons.indent),
      tooltip: this.lang.paragraph.indent + this.representShortcut('indent'),
      click: this.context.createInvokeHandler('editor.indent'),
    });

    this.context.memo('button.justifyLeft', func.invoke(justifyLeft, 'render'));
    this.context.memo('button.justifyCenter', func.invoke(justifyCenter, 'render'));
    this.context.memo('button.justifyRight', func.invoke(justifyRight, 'render'));
    this.context.memo('button.justifyFull', func.invoke(justifyFull, 'render'));
    this.context.memo('button.outdent', func.invoke(outdent, 'render'));
    this.context.memo('button.indent', func.invoke(indent, 'render'));

    this.context.memo('button.paragraph', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.alignLeft), this.options),
          tooltip: this.lang.paragraph.paragraph,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown([
          this.ui.buttonGroup({
            className: 'note-align',
            children: [justifyLeft, justifyCenter, justifyRight, justifyFull],
          }),
          this.ui.buttonGroup({
            className: 'note-list',
            children: [outdent, indent],
          }),
        ]),
      ]).render();
    });

    this.context.memo('button.height', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.textHeight), this.options),
          tooltip: this.lang.font.height,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdownCheck({
          items: this.options.lineHeights,
          checkClassName: this.options.icons.menuCheck,
          className: 'dropdown-line-height',
          title: this.lang.font.height,
          click: this.context.createInvokeHandler('editor.lineHeight'),
        }),
      ]).render();
    });

    this.context.memo('button.table', () => {
      return this.ui.buttonGroup([
        this.button({
          className: '',
          contents: this.ui.dropdownButtonContents(this.ui.icon(this.options.icons.table), this.options),
          tooltip: this.lang.table.table,
          data: {
            toggle: 'dropdown',
          },
        }),
        this.ui.dropdown({
          title: this.lang.table.table,
          className: 'note-table',
          items: [
            '<div class="note-dimension-picker">',
            '<div class="note-dimension-picker-mousecatcher" data-event="insertTable" data-value="1x1"></div>',
            '<div class="note-dimension-picker-highlighted"></div>',
            '<div class="note-dimension-picker-unhighlighted"></div>',
            '</div>',
            '<div class="note-dimension-display">1 x 1</div>',
          ].join(''),
        }),
      ], {
        callback: ($node) => {
          const $catcher = $node.find('.note-dimension-picker-mousecatcher');
          $catcher.css({
            width: this.options.insertTableMaxSize.col + 'em',
            height: this.options.insertTableMaxSize.row + 'em',
          }).mousedown(this.context.createInvokeHandler('editor.insertTable'))
            .on('mousemove', this.tableMoveHandler.bind(this));
        },
      }).render();
    });

    this.context.memo('button.link', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.link),
        tooltip: this.lang.link.link + this.representShortcut('linkDialog.show'),
        click: this.context.createInvokeHandler('linkDialog.show'),
      }).render();
    });

    this.context.memo('button.picture', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.picture),
        tooltip: this.lang.image.image,
        click: this.context.createInvokeHandler('imageDialog.show'),
      }).render();
    });

    this.context.memo('button.video', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.video),
        tooltip: this.lang.video.video,
        click: this.context.createInvokeHandler('videoDialog.show'),
      }).render();
    });

    this.context.memo('button.hr', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.minus),
        tooltip: this.lang.hr.insert + this.representShortcut('insertHorizontalRule'),
        click: this.context.createInvokeHandler('editor.insertHorizontalRule'),
      }).render();
    });

    this.context.memo('button.fullscreen', () => {
      return this.button({
        className: 'btn-fullscreen note-codeview-keep',
        contents: this.ui.icon(this.options.icons.arrowsAlt),
        tooltip: this.lang.options.fullscreen,
        click: this.context.createInvokeHandler('fullscreen.toggle'),
      }).render();
    });

    this.context.memo('button.codeview', () => {
      return this.button({
        className: 'btn-codeview note-codeview-keep',
        contents: this.ui.icon(this.options.icons.code),
        tooltip: this.lang.options.codeview,
        click: this.context.createInvokeHandler('codeview.toggle'),
      }).render();
    });

    this.context.memo('button.redo', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.redo),
        tooltip: this.lang.history.redo + this.representShortcut('redo'),
        click: this.context.createInvokeHandler('editor.redo'),
      }).render();
    });

    this.context.memo('button.undo', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.undo),
        tooltip: this.lang.history.undo + this.representShortcut('undo'),
        click: this.context.createInvokeHandler('editor.undo'),
      }).render();
    });

    this.context.memo('button.help', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.question),
        tooltip: this.lang.options.help,
        click: this.context.createInvokeHandler('helpDialog.show'),
      }).render();
    });
  }

  /**
   * image: [
   *   ['imageResize', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
   *   ['float', ['floatLeft', 'floatRight', 'floatNone']],
   *   ['remove', ['removeMedia']],
   * ],
   */
  addImagePopoverButtons() {
    // Image Size Buttons
    this.context.memo('button.resizeFull', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">100%</span>',
        tooltip: this.lang.image.resizeFull,
        click: this.context.createInvokeHandler('editor.resize', '1'),
      }).render();
    });
    this.context.memo('button.resizeHalf', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">50%</span>',
        tooltip: this.lang.image.resizeHalf,
        click: this.context.createInvokeHandler('editor.resize', '0.5'),
      }).render();
    });
    this.context.memo('button.resizeQuarter', () => {
      return this.button({
        contents: '<span class="note-fontsize-10">25%</span>',
        tooltip: this.lang.image.resizeQuarter,
        click: this.context.createInvokeHandler('editor.resize', '0.25'),
      }).render();
    });
    this.context.memo('button.resizeNone', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.rollback),
        tooltip: this.lang.image.resizeNone,
        click: this.context.createInvokeHandler('editor.resize', '0'),
      }).render();
    });

    // Float Buttons
    this.context.memo('button.floatLeft', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.floatLeft),
        tooltip: this.lang.image.floatLeft,
        click: this.context.createInvokeHandler('editor.floatMe', 'left'),
      }).render();
    });

    this.context.memo('button.floatRight', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.floatRight),
        tooltip: this.lang.image.floatRight,
        click: this.context.createInvokeHandler('editor.floatMe', 'right'),
      }).render();
    });

    this.context.memo('button.floatNone', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.rollback),
        tooltip: this.lang.image.floatNone,
        click: this.context.createInvokeHandler('editor.floatMe', 'none'),
      }).render();
    });

    // Remove Buttons
    this.context.memo('button.removeMedia', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.trash),
        tooltip: this.lang.image.remove,
        click: this.context.createInvokeHandler('editor.removeMedia'),
      }).render();
    });
  }

  addLinkPopoverButtons() {
    this.context.memo('button.linkDialogShow', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.link),
        tooltip: this.lang.link.edit,
        click: this.context.createInvokeHandler('linkDialog.show'),
      }).render();
    });

    this.context.memo('button.unlink', () => {
      return this.button({
        contents: this.ui.icon(this.options.icons.unlink),
        tooltip: this.lang.link.unlink,
        click: this.context.createInvokeHandler('editor.unlink'),
      }).render();
    });
  }

  /**
   * table : [
   *  ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
   *  ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
   * ],
   */
  addTablePopoverButtons() {
    this.context.memo('button.addRowUp', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowAbove),
        tooltip: this.lang.table.addRowAbove,
        click: this.context.createInvokeHandler('editor.addRow', 'top'),
      }).render();
    });
    this.context.memo('button.addRowDown', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowBelow),
        tooltip: this.lang.table.addRowBelow,
        click: this.context.createInvokeHandler('editor.addRow', 'bottom'),
      }).render();
    });
    this.context.memo('button.addColLeft', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colBefore),
        tooltip: this.lang.table.addColLeft,
        click: this.context.createInvokeHandler('editor.addCol', 'left'),
      }).render();
    });
    this.context.memo('button.addColRight', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colAfter),
        tooltip: this.lang.table.addColRight,
        click: this.context.createInvokeHandler('editor.addCol', 'right'),
      }).render();
    });
    this.context.memo('button.deleteRow', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.rowRemove),
        tooltip: this.lang.table.delRow,
        click: this.context.createInvokeHandler('editor.deleteRow'),
      }).render();
    });
    this.context.memo('button.deleteCol', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.colRemove),
        tooltip: this.lang.table.delCol,
        click: this.context.createInvokeHandler('editor.deleteCol'),
      }).render();
    });
    this.context.memo('button.deleteTable', () => {
      return this.button({
        className: 'btn-md',
        contents: this.ui.icon(this.options.icons.trash),
        tooltip: this.lang.table.delTable,
        click: this.context.createInvokeHandler('editor.deleteTable'),
      }).render();
    });
  }

  build($container, groups) {
    for (let groupIdx = 0, groupLen = groups.length; groupIdx < groupLen; groupIdx++) {
      const group = groups[groupIdx];
      const groupName = Array.isArray(group) ? group[0] : group;
      const buttons = Array.isArray(group) ? ((group.length === 1) ? [group[0]] : group[1]) : [group];

      const $group = this.ui.buttonGroup({
        className: 'note-' + groupName,
      }).render();

      for (let idx = 0, len = buttons.length; idx < len; idx++) {
        const btn = this.context.memo('button.' + buttons[idx]);
        if (btn) {
          $group.append(typeof btn === 'function' ? btn(this.context) : btn);
        }
      }
      $group.appendTo($container);
    }
  }

  /**
   * @param {jQuery} [$container]
   */
  updateCurrentStyle($container) {
    const $cont = $container || this.$toolbar;

    const styleInfo = this.context.invoke('editor.currentStyle');
    this.updateBtnStates($cont, {
      '.note-btn-bold': () => {
        return styleInfo['font-bold'] === 'bold';
      },
      '.note-btn-italic': () => {
        return styleInfo['font-italic'] === 'italic';
      },
      '.note-btn-underline': () => {
        return styleInfo['font-underline'] === 'underline';
      },
      '.note-btn-subscript': () => {
        return styleInfo['font-subscript'] === 'subscript';
      },
      '.note-btn-superscript': () => {
        return styleInfo['font-superscript'] === 'superscript';
      },
      '.note-btn-strikethrough': () => {
        return styleInfo['font-strikethrough'] === 'strikethrough';
      },
    });

    if (styleInfo['font-family']) {
      const fontNames = styleInfo['font-family'].split(',').map((name) => {
        return name.replace(/[\'\"]/g, '')
          .replace(/\s+$/, '')
          .replace(/^\s+/, '');
      });
      const fontName = lists.find(fontNames, this.isFontInstalled.bind(this));

      $cont.find('.dropdown-fontname a').each((idx, item) => {
        const $item = $(item);
        // always compare string to avoid creating another func.
        const isChecked = ($item.data('value') + '') === (fontName + '');
        $item.toggleClass('checked', isChecked);
      });
      $cont.find('.note-current-fontname').text(fontName).css('font-family', fontName);
    }

    if (styleInfo['font-size']) {
      const fontSize = styleInfo['font-size'];
      $cont.find('.dropdown-fontsize a').each((idx, item) => {
        const $item = $(item);
        // always compare with string to avoid creating another func.
        const isChecked = ($item.data('value') + '') === (fontSize + '');
        $item.toggleClass('checked', isChecked);
      });
      $cont.find('.note-current-fontsize').text(fontSize);

      const fontSizeUnit = styleInfo['font-size-unit'];
      $cont.find('.dropdown-fontsizeunit a').each((idx, item) => {
        const $item = $(item);
        const isChecked = ($item.data('value') + '') === (fontSizeUnit + '');
        $item.toggleClass('checked', isChecked);
      });
      $cont.find('.note-current-fontsizeunit').text(fontSizeUnit);
    }

    if (styleInfo['line-height']) {
      const lineHeight = styleInfo['line-height'];
      $cont.find('.dropdown-line-height li a').each((idx, item) => {
        // always compare with string to avoid creating another func.
        const isChecked = ($(item).data('value') + '') === (lineHeight + '');
        this.className = isChecked ? 'checked' : '';
      });
    }
  }

  updateBtnStates($container, infos) {
    $.each(infos, (selector, pred) => {
      this.ui.toggleBtnActive($container.find(selector), pred());
    });
  }

  tableMoveHandler(event) {
    const PX_PER_EM = 18;
    const $picker = $(event.target.parentNode); // target is mousecatcher
    const $dimensionDisplay = $picker.next();
    const $catcher = $picker.find('.note-dimension-picker-mousecatcher');
    const $highlighted = $picker.find('.note-dimension-picker-highlighted');
    const $unhighlighted = $picker.find('.note-dimension-picker-unhighlighted');

    let posOffset;
    // HTML5 with jQuery - e.offsetX is undefined in Firefox
    if (event.offsetX === undefined) {
      const posCatcher = $(event.target).offset();
      posOffset = {
        x: event.pageX - posCatcher.left,
        y: event.pageY - posCatcher.top,
      };
    } else {
      posOffset = {
        x: event.offsetX,
        y: event.offsetY,
      };
    }

    const dim = {
      c: Math.ceil(posOffset.x / PX_PER_EM) || 1,
      r: Math.ceil(posOffset.y / PX_PER_EM) || 1,
    };

    $highlighted.css({ width: dim.c + 'em', height: dim.r + 'em' });
    $catcher.data('value', dim.c + 'x' + dim.r);

    if (dim.c > 3 && dim.c < this.options.insertTableMaxSize.col) {
      $unhighlighted.css({ width: dim.c + 1 + 'em' });
    }

    if (dim.r > 3 && dim.r < this.options.insertTableMaxSize.row) {
      $unhighlighted.css({ height: dim.r + 1 + 'em' });
    }

    $dimensionDisplay.html(dim.c + ' x ' + dim.r);
  }
}

import Toolbar from 'summernote/src/js/base/module/Toolbar';
import LinkDialog from 'summernote/src/js/base/module/LinkDialog';
import LinkPopover from 'summernote/src/js/base/module/LinkPopover';
import ImageDialog from 'summernote/src/js/base/module/ImageDialog';
import ImagePopover from 'summernote/src/js/base/module/ImagePopover';
import TablePopover from 'summernote/src/js/base/module/TablePopover';
import VideoDialog from 'summernote/src/js/base/module/VideoDialog';
import HelpDialog from 'summernote/src/js/base/module/HelpDialog';
import AirPopover from 'summernote/src/js/base/module/AirPopover';
import HintPopover from 'summernote/src/js/base/module/HintPopover';

$.summernote = $.extend($.summernote, {
  version: '@@VERSION@@',
  plugins: {},

  dom: dom,
  range: range,
  lists: lists,

  options: {
    langInfo: $.summernote.lang['en-US'],
    editing: true,
    modules: {
      'editor': Editor,
      'clipboard': Clipboard,
      'dropzone': Dropzone,
      'codeview': Codeview,
      'statusbar': Statusbar,
      'fullscreen': Fullscreen,
      'handle': Handle,
      // FIXME: HintPopover must be front of autolink
      //  - Script error about range when Enter key is pressed on hint popover
      'hintPopover': HintPopover,
      'autoLink': AutoLink,
      'autoSync': AutoSync,
      'autoReplace': AutoReplace,
      'placeholder': Placeholder,
      'buttons': Buttons,
      'toolbar': Toolbar,
      'linkDialog': LinkDialog,
      'linkPopover': LinkPopover,
      'imageDialog': ImageDialog,
      'imagePopover': ImagePopover,
      'tablePopover': TablePopover,
      'videoDialog': VideoDialog,
      'helpDialog': HelpDialog,
      'airPopover': AirPopover,
    },

    buttons: {},

    lang: 'en-US',

    followingToolbar: false,
    toolbarPosition: 'top',
    otherStaticBar: '',

    // toolbar
    codeviewKeepButton: false,
    toolbar: [
      ['style', ['style', 'bold', 'italic', 'underline', 'clear']],
      ['font'],
      ['fontname', ['fontname']],
      ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['table', ['table']],
      ['insert', ['picture',]],
      ['view', ['fullscreen']],
    ],
    // popover
    popatmouse: true,
    popover: {
      image: [
        ['resize', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
        ['float', ['floatLeft', 'floatRight', 'floatNone']],
        ['remove', ['removeMedia']],
      ],
      link: [
        ['link', ['linkDialogShow', 'unlink']],
      ],
      table: [
        ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
        ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
      ],
      air: [
        ['color', ['color']],
        ['font', ['bold', 'underline', 'clear']],
        ['para', ['ul', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture']],
        ['view', ['fullscreen', 'codeview']],
      ],
    },

    // air mode: inline editor
    airMode: false,
    overrideContextMenu: false, // TBD

    width: null,
    height: null,
    linkTargetBlank: true,
    useProtocol: true,
    defaultProtocol: 'http://',

    focus: false,
    tabDisabled: false,
    tabSize: 4,
    styleWithCSS: false,
    shortcuts: true,
    textareaAutoSync: true,
    tooltip: 'auto',
    container: null,
    maxTextLength: 0,
    blockquoteBreakingLevel: 2,
    spellCheck: true,
    disableGrammar: false,
    placeholder: null,
    inheritPlaceholder: false,
    // TODO: need to be documented
    recordEveryKeystroke: false,
    historyLimit: 200,

    // TODO: need to be documented
    showDomainOnlyForAutolink: false,

    // TODO: need to be documented
    hintMode: 'word',
    hintSelect: 'after',
    hintDirection: 'bottom',

    styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

    fontNames: [
      'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
      'Helvetica Neue', 'Helvetica', 'Impact', 'Lucida Grande',
      'Tahoma', 'Times New Roman', 'Verdana',
    ],
    fontNamesIgnoreCheck: [],
    addDefaultFonts: true,

    fontSizes: ['8', '9', '10', '11', '12', '14', '18', '24', '36'],

    fontSizeUnits: ['px', 'pt'],

    // pallete colors(n x n)
    colors: [
      ['#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F7F7', '#FFFFFF'],
      ['#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF'],
      ['#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7', '#D6D6E7', '#E7D6DE'],
      ['#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF', '#B5A5D6', '#D6A5BD'],
      ['#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE', '#8C7BC6', '#C67BA5'],
      ['#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6', '#634AA5', '#A54A7B'],
      ['#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294', '#311873', '#731842'],
      ['#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163', '#21104A', '#4A1031'],
    ],

    // http://chir.ag/projects/name-that-color/
    colorsName: [
      ['Black', 'Tundora', 'Dove Gray', 'Star Dust', 'Pale Slate', 'Gallery', 'Alabaster', 'White'],
      ['Red', 'Orange Peel', 'Yellow', 'Green', 'Cyan', 'Blue', 'Electric Violet', 'Magenta'],
      ['Azalea', 'Karry', 'Egg White', 'Zanah', 'Botticelli', 'Tropical Blue', 'Mischka', 'Twilight'],
      ['Tonys Pink', 'Peach Orange', 'Cream Brulee', 'Sprout', 'Casper', 'Perano', 'Cold Purple', 'Careys Pink'],
      ['Mandy', 'Rajah', 'Dandelion', 'Olivine', 'Gulf Stream', 'Viking', 'Blue Marguerite', 'Puce'],
      ['Guardsman Red', 'Fire Bush', 'Golden Dream', 'Chelsea Cucumber', 'Smalt Blue', 'Boston Blue', 'Butterfly Bush', 'Cadillac'],
      ['Sangria', 'Mai Tai', 'Buddha Gold', 'Forest Green', 'Eden', 'Venice Blue', 'Meteorite', 'Claret'],
      ['Rosewood', 'Cinnamon', 'Olive', 'Parsley', 'Tiber', 'Midnight Blue', 'Valentino', 'Loulou'],
    ],

    colorButton: {
      foreColor: '#000000',
      backColor: '#FFFF00',
    },

    lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0'],

    tableClassName: 'table table-bordered',

    insertTableMaxSize: {
      col: 10,
      row: 10,
    },

    // By default, dialogs are attached in container.
    dialogsInBody: false,
    dialogsFade: false,

    maximumImageFileSize: null,

    callbacks: {
      onBeforeCommand: null,
      onBlur: null,
      onBlurCodeview: null,
      onChange: null,
      onChangeCodeview: null,
      onDialogShown: null,
      onEnter: null,
      onFocus: null,
      onImageLinkInsert: null,
      onImageUpload: null,
      onImageUploadError: null,
      onInit: null,
      onKeydown: null,
      onKeyup: null,
      onMousedown: null,
      onMouseup: null,
      onPaste: null,
      onScroll: null,
    },

    codemirror: {
      mode: 'text/html',
      htmlMode: true,
      lineNumbers: true,
    },

    codeviewFilter: false,
    codeviewFilterRegex: /<\/*(?:applet|b(?:ase|gsound|link)|embed|frame(?:set)?|ilayer|l(?:ayer|ink)|meta|object|s(?:cript|tyle)|t(?:itle|extarea)|xml)[^>]*?>/gi,
    codeviewIframeFilter: true,
    codeviewIframeWhitelistSrc: [],
    codeviewIframeWhitelistSrcBase: [
      'www.youtube.com',
      'www.youtube-nocookie.com',
      'www.facebook.com',
      'vine.co',
      'instagram.com',
      'player.vimeo.com',
      'www.dailymotion.com',
      'player.youku.com',
      'v.qq.com',
    ],

    keyMap: {
      pc: {
        'ESC': 'escape',
        'ENTER': 'insertParagraph',
        'CTRL+Z': 'undo',
        'CTRL+Y': 'redo',
        'TAB': 'tab',
        'SHIFT+TAB': 'untab',
        'CTRL+B': 'bold',
        'CTRL+I': 'italic',
        'CTRL+U': 'underline',
        'CTRL+SHIFT+S': 'strikethrough',
        'CTRL+BACKSLASH': 'removeFormat',
        'CTRL+SHIFT+L': 'justifyLeft',
        'CTRL+SHIFT+E': 'justifyCenter',
        'CTRL+SHIFT+R': 'justifyRight',
        'CTRL+SHIFT+J': 'justifyFull',
        'CTRL+SHIFT+NUM7': 'insertUnorderedList',
        'CTRL+SHIFT+NUM8': 'insertOrderedList',
        'CTRL+LEFTBRACKET': 'outdent',
        'CTRL+RIGHTBRACKET': 'indent',
        'CTRL+NUM0': 'formatPara',
        'CTRL+NUM1': 'formatH1',
        'CTRL+NUM2': 'formatH2',
        'CTRL+NUM3': 'formatH3',
        'CTRL+NUM4': 'formatH4',
        'CTRL+NUM5': 'formatH5',
        'CTRL+NUM6': 'formatH6',
        'CTRL+ENTER': 'insertHorizontalRule',
        'CTRL+K': 'linkDialog.show',
      },

      mac: {
        'ESC': 'escape',
        'ENTER': 'insertParagraph',
        'CMD+Z': 'undo',
        'CMD+SHIFT+Z': 'redo',
        'TAB': 'tab',
        'SHIFT+TAB': 'untab',
        'CMD+B': 'bold',
        'CMD+I': 'italic',
        'CMD+U': 'underline',
        'CMD+SHIFT+S': 'strikethrough',
        'CMD+BACKSLASH': 'removeFormat',
        'CMD+SHIFT+L': 'justifyLeft',
        'CMD+SHIFT+E': 'justifyCenter',
        'CMD+SHIFT+R': 'justifyRight',
        'CMD+SHIFT+J': 'justifyFull',
        'CMD+SHIFT+NUM7': 'insertUnorderedList',
        'CMD+SHIFT+NUM8': 'insertOrderedList',
        'CMD+LEFTBRACKET': 'outdent',
        'CMD+RIGHTBRACKET': 'indent',
        'CMD+NUM0': 'formatPara',
        'CMD+NUM1': 'formatH1',
        'CMD+NUM2': 'formatH2',
        'CMD+NUM3': 'formatH3',
        'CMD+NUM4': 'formatH4',
        'CMD+NUM5': 'formatH5',
        'CMD+NUM6': 'formatH6',
        'CMD+ENTER': 'insertHorizontalRule',
        'CMD+K': 'linkDialog.show',
      },
    },
    icons: {
      'align': 'note-icon-align',
      'alignCenter': 'note-icon-align-center',
      'alignJustify': 'note-icon-align-justify',
      'alignLeft': 'note-icon-align-left',
      'alignRight': 'note-icon-align-right',
      'rowBelow': 'note-icon-row-below',
      'colBefore': 'note-icon-col-before',
      'colAfter': 'note-icon-col-after',
      'rowAbove': 'note-icon-row-above',
      'rowRemove': 'note-icon-row-remove',
      'colRemove': 'note-icon-col-remove',
      'indent': 'note-icon-align-indent',
      'outdent': 'note-icon-align-outdent',
      'arrowsAlt': 'note-icon-arrows-alt',
      'bold': 'note-icon-bold',
      'caret': 'note-icon-caret',
      'circle': 'note-icon-circle',
      'close': 'note-icon-close',
      'code': 'note-icon-code',
      'eraser': 'note-icon-eraser',
      'floatLeft': 'note-icon-float-left',
      'floatRight': 'note-icon-float-right',
      'font': 'note-icon-font',
      'frame': 'note-icon-frame',
      'italic': 'note-icon-italic',
      'link': 'note-icon-link',
      'unlink': 'note-icon-chain-broken',
      'magic': 'note-icon-magic',
      'menuCheck': 'note-icon-menu-check',
      'minus': 'note-icon-minus',
      'orderedlist': 'note-icon-orderedlist',
      'pencil': 'note-icon-pencil',
      'picture': 'note-icon-picture',
      'question': 'note-icon-question',
      'redo': 'note-icon-redo',
      'rollback': 'note-icon-rollback',
      'square': 'note-icon-square',
      'strikethrough': 'note-icon-strikethrough',
      'subscript': 'note-icon-subscript',
      'superscript': 'note-icon-superscript',
      'table': 'note-icon-table',
      'textHeight': 'note-icon-text-height',
      'trash': 'note-icon-trash',
      'underline': 'note-icon-underline',
      'undo': 'note-icon-undo',
      'unorderedlist': 'note-icon-unorderedlist',
      'video': 'note-icon-video',
    },
  },
});

import renderer from 'summernote/src/js/base/renderer';

import TooltipUI from 'summernote/src/js/lite/ui/TooltipUI';
import DropdownUI from 'summernote/src/js/lite/ui/DropdownUI';

const editor = renderer.create('<div class="note-editor note-frame border"/>');
const toolbar = renderer.create('<div class="note-toolbar bg-light border-bottom" role="toolbar"/>');
const editingArea = renderer.create('<div class="note-editing-area"/>');
const codable = renderer.create('<textarea class="note-codable" aria-multiline="true"/>');
const editable = renderer.create('<div class="note-editable bg-white" contentEditable="true" role="textbox" aria-multiline="true"/>');
const statusbar = renderer.create([
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
  '<div class="note-statusbar bg-light border-top" role="status">',
  '<div class="note-resizebar" aria-label="resize">',
  '<div class="note-icon-bar border-top"></div>',
  '<div class="note-icon-bar border-top"></div>',
  '<div class="note-icon-bar border-top"></div>',
  '</div>',
  '</div>',
].join(''));

const airEditor = renderer.create('<div class="note-editor note-airframe"/>');
const airEditable = renderer.create([
  '<div class="note-editable" contentEditable="true" role="textbox" aria-multiline="true"></div>',
  '<output class="note-status-output" role="status" aria-live="polite"></output>',
].join(''));

const buttonGroup = renderer.create('<div class="note-btn-group">');
const button = renderer.create('<button type="button" class="note-btn" tabindex="-1">', function ($node, options) {
  // set button type
  if (options && options.tooltip) {
    $node.attr({
      'aria-label': options.tooltip,
    });
    $node.data('_lite_tooltip', new TooltipUI($node, {
      title: options.tooltip,
      container: options.container,
    })).on('click', (e) => {
      $(e.currentTarget).data('_lite_tooltip').hide();
    });
  }
  if (options.contents) {
    $node.html(options.contents);
  }

  if (options && options.data && options.data.toggle === 'dropdown') {
    $node.data('_lite_dropdown', new DropdownUI($node, {
      container: options.container,
    }));
  }

  if (options && options.codeviewKeepButton) {
    $node.addClass('note-codeview-keep');
  }
});

const dropdown = renderer.create('<div class="note-dropdown-menu text-nowrap" style="box-sizing: content-box;" role="list">', function ($node, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function (item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;
    const $temp = $('<a class="note-dropdown-item" href="#" data-value="' + value + '" role="listitem" aria-label="' + value + '"></a>');

    $temp.html(content).data('item', item);

    return $temp;
  }) : options.items;

  $node.html(markup).attr({ 'aria-label': options.title });

  $node.on('click', '> .note-dropdown-item', function (e) {
    const $a = $(this);

    const item = $a.data('item');
    const value = $a.data('value');

    if (item.click) {
      item.click($a);
    } else if (options.itemClick) {
      options.itemClick(e, item, value);
    }
  });
  if (options && options.codeviewKeepButton) {
    $node.addClass('note-codeview-keep');
  }
});

const dropdownCheck = renderer.create('<div class="note-dropdown-menu note-check" style="box-sizing: content-box;" role="list">', function ($node, options) {
  const markup = Array.isArray(options.items) ? options.items.map(function (item) {
    const value = (typeof item === 'string') ? item : (item.value || '');
    const content = options.template ? options.template(item) : item;

    const $temp = $('<a class="note-dropdown-item" href="#" data-value="' + value + '" role="listitem" aria-label="' + item + '"></a>');
    $temp.html([icon(options.checkClassName), ' ', content]).data('item', item);
    return $temp;
  }) : options.items;

  $node.html(markup).attr({ 'aria-label': options.title });

  $node.on('click', '> .note-dropdown-item', function (e) {
    const $a = $(this);

    const item = $a.data('item');
    const value = $a.data('value');

    if (item.click) {
      item.click($a);
    } else if (options.itemClick) {
      options.itemClick(e, item, value);
    }
  });
  if (options && options.codeviewKeepButton) {
    $node.addClass('note-codeview-keep');
  }
});

const dropdownButtonContents = function (contents, options) {
  return contents;
};

const palette = renderer.create('<div class="note-color-palette"/>', function ($node, options) {
  const contents = [];
  for (let row = 0, rowSize = options.colors.length; row < rowSize; row++) {
    const eventName = options.eventName;
    const colors = options.colors[row];
    const colorsName = options.colorsName[row];
    const buttons = [];
    for (let col = 0, colSize = colors.length; col < colSize; col++) {
      const color = colors[col];
      const colorName = colorsName[col];
      buttons.push([
        '<button type="button" class="note-btn note-color-btn"',
        'style="background-color:', color, '" ',
        'data-event="', eventName, '" ',
        'data-value="', color, '" ',
        'data-title="', colorName, '" ',
        'aria-label="', colorName, '" ',
        'data-toggle="button" tabindex="-1"></button>',
      ].join(''));
    }
    contents.push('<div class="note-color-row">' + buttons.join('') + '</div>');
  }
  $node.html(contents.join(''));

  $node.find('.note-color-btn').each(function () {
    $(this).data('_lite_tooltip', new TooltipUI($(this), {
      container: options.container,
    }));
  });
});

const dialog = renderer.create('<div class="modal" aria-hidden="false" tabindex="-1" role="dialog"/>', function ($node, options) {
  if (options.fade) {
    $node.addClass('fade');
  }
  $node.attr({
    'aria-label': options.title,
  });
  $node.html([
    '<div class="modal-dialog">',
    '<div class="modal-content">',
    (options.title ? '<div class="modal-header"><h4 class="modal-title">' + options.title + '</h4><button type="button" class="close" aria-label="Close" aria-hidden="true"><i class="note-icon-close"></i></button></div>' : ''),
    '<div class="modal-body">' + options.body + '</div>',
    (options.footer ? '<div class="modal-footer">' + options.footer + '</div>' : ''),
    '</div>',
    '</div>'
  ].join(''));

  const $modal = $node;

  const hide = () => {
    $(document.body).find('.modal').not($modal).removeClass('d-none');
    $modal.removeClass('open').hide();
    $modal.trigger('modal.hide');
    $modal.off('keydown');
  }

  const show = () => {
    $(document.body).find('.modal').not($modal).addClass('d-none');

    $modal.addClass('open').show();
    $modal.trigger('modal.show');
    $modal.off('click', '.close').on('click', '.close', hide);
    $modal.on('keydown', (event) => {
      if (event.which === 27) {
        event.preventDefault();
        hide();
      }
    });
  };

  $node.data('modal', { show, hide });
});

const popover = renderer.create([
  '<div class="note-popover bottom">',
  '<div class="note-popover-arrow"></div>',
  '<div class="popover-content note-children-container"></div>',
  '</div>',
].join(''), function ($node, options) {
  const direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

  $node.addClass(direction).hide();

  if (options.hideArrow) {
    $node.find('.note-popover-arrow').hide();
  }
});

const checkbox = renderer.create('<div class="checkbox"></div>', function ($node, options) {
  $node.html([
    '<label' + (options.id ? ' for="note-' + options.id + '"' : '') + '>',
    '<input role="checkbox" type="checkbox"' + (options.id ? ' id="note-' + options.id + '"' : ''),
    (options.checked ? ' checked' : ''),
    ' aria-checked="' + (options.checked ? 'true' : 'false') + '"/>',
    (options.text ? options.text : ''),
    '</label>',
  ].join(''));
});

const icon = function (iconClassName, tagName) {
  tagName = tagName || 'i';
  return '<' + tagName + ' class="' + iconClassName + '"/>';
};

const ui = function (editorOptions) {
  return {
    editor: editor,
    toolbar: toolbar,
    editingArea: editingArea,
    codable: codable,
    editable: editable,
    statusbar: statusbar,
    airEditor: airEditor,
    airEditable: airEditable,
    buttonGroup: buttonGroup,
    button: button,
    dropdown: dropdown,
    dropdownCheck: dropdownCheck,
    dropdownButtonContents: dropdownButtonContents,
    palette: palette,
    dialog: dialog,
    popover: popover,
    checkbox: checkbox,
    icon: icon,
    options: editorOptions,

    toggleBtn: function ($btn, isEnable) {
      $btn.toggleClass('disabled', !isEnable);
      $btn.attr('disabled', !isEnable);
    },

    toggleBtnActive: function ($btn, isActive) {
      $btn.toggleClass('active', isActive);
    },

    check: function ($dom, value) {
      $dom.find('.checked').removeClass('checked');
      $dom.find('[data-value="' + value + '"]').addClass('checked');
    },

    onDialogShown: function ($dialog, handler) {
      $dialog.one('modal.show', handler);
    },

    onDialogHidden: function ($dialog, handler) {
      $dialog.one('modal.hide', handler);
    },

    showDialog: function ($dialog) {
      $dialog.data('modal').show();
    },

    hideDialog: function ($dialog) {
      $dialog.data('modal').hide();
    },

    /**
     * get popover content area
     *
     * @param $popover
     * @returns {*}
     */
    getPopoverContent: function ($popover) {
      return $popover.find('.note-popover-content');
    },

    /**
     * get dialog's body area
     *
     * @param $dialog
     * @returns {*}
     */
    getDialogBody: function ($dialog) {
      return $dialog.find('.modal-body');
    },

    createLayout: function ($note) {
      const $editor = (editorOptions.airMode ? airEditor([
        editingArea([
          codable(),
          airEditable(),
        ]),
      ]) : (editorOptions.toolbarPosition === 'bottom'
        ? editor([
          editingArea([
            codable(),
            editable(),
          ]),
          toolbar(),
          statusbar(),
        ])
        : editor([
          toolbar(),
          editingArea([
            codable(),
            editable(),
          ]),
          statusbar(),
        ])
      )).render();

      $editor.insertAfter($note);

      return {
        note: $note,
        editor: $editor,
        toolbar: $editor.find('.note-toolbar'),
        editingArea: $editor.find('.note-editing-area'),
        editable: $editor.find('.note-editable'),
        codable: $editor.find('.note-codable'),
        statusbar: $editor.find('.note-statusbar'),
      };
    },

    removeLayout: function ($note, layoutInfo) {
      $note.html(layoutInfo.editable.html());
      layoutInfo.editor.remove();
      $note.off('summernote'); // remove summernote custom event
      $note.show();
    },
  };
};

$.summernote = $.extend($.summernote, {
  ui_template: ui,
  interface: 'lite',
});
