import $ from 'jquery';
import './summernote';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useRef } from 'react';

const DocumentEditor = (props) => {
  const { disabled, value } = props;
  const self = useRef(null);
  const editorId = useMemo(() => `editor-${Math.floor(Math.random() * 100000)}`, []);

  const enable = () => {
    const editor = self.current.editor;
    editor.summernote('enable');
  }

  const disable = () => {
    const editor = self.current.editor;
    editor.summernote('disable');
  }

  const focus = () => {
    const editor = self.current.editor;
    editor.summernote('focus');
  }

  const isEmpty = () => {
    const editor = self.current.editor;
    return editor.summernote('isEmpty');
  }

  const reset = () => {
    const editor = self.current.editor;
    editor.summernote('reset');
  }

  const replace = (content) => {
    content = content || '';
    const editor = self.current.editor;
    const editorEditable = self.current.editorEditable;
    const editorPlaceholder = self.current.editorPlaceholder;

    const prevContent = editorEditable.html();
    const contentLength = content.length;

    if (prevContent !== content) {
      if (isEmpty() && contentLength > 0) {
        editorPlaceholder.hide();
      } else if (contentLength === 0) {
        editorPlaceholder.show();
      }

      editorEditable.html(content);
    }
  }

  const destroy = () => {
    const editor = self.current.editor;

    if (editor && editor.summernote) {
      editor.summernote('destroy');
    }

    self.current = null;
  }

  const initialize = () => {
    const options = props.options;
    options.callbacks = {
      onEnter: props.onEnter,
      onFocus: props.onFocus,
      onBlur: props.onBlur,
      onKeyup: props.onKeyUp,
      onKeydown: props.onKeyDown,
      onPaste: props.onPaste,
      onChange: props.onChange,
    };
    const editor = $(`#${editorId}`);
    editor.summernote({...options, minHeight: 180, dialogsInBody: true });
   
    const editorEditable = editor.parent().find('.note-editable');
    const editorPlaceholder = editor.parent().find('.note-placeholder');

    self.current = { editor, editorEditable, editorPlaceholder };
  }

  useEffect(() => {
    initialize();

    return () => {
      destroy();
    };
  }, []);

  useEffect(() => {

    if (disabled) {
      disable();
    }
    else {
      enable();
    }
  }, [disabled]);

  useEffect(() => {
    replace(value);
  }, [value]);

    return <><div id={editorId}></div></>;
};

DocumentEditor.propTypes = {
  value: PropTypes.string,
  options: PropTypes.object,
  disabled: PropTypes.bool,
  onInit: PropTypes.func,
  onEnter: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyUp: PropTypes.func,
  onKeyDown: PropTypes.func,
  onPaste: PropTypes.func,
  onChange: PropTypes.func,
};

DocumentEditor.defaultProps = {
  value: undefined,
  options: {},
  disabled: false,

};

export default DocumentEditor;