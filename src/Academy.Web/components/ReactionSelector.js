import React, { Component, useState } from 'react';

const active = Component => {
    return class Active extends React.Component {
        state = { active: false }
        handleMouseDown = () => this.setState({ active: true })
        handleMouseUp = () => this.setState({ active: false })

        render() {
            return (
                <div onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}>
                    <Component {...this.props} {...this.state} />
                </div>
            )
        }
    }
};

const ReactionSelectorEmoji = ({ icon, label, onSelect, hover }) => {
    const styles = reactCSS({
      'default': {
        wrap: {
          padding: '5px',
          position: 'relative',
        },
        icon: {
          paddingBottom: '100%',
          backgroundImage: `url(${ icon })`,
          backgroundSize: '100% 100%',
          transformOrigin: 'bottom',
          cursor: 'pointer',
  
          transition: '200ms transform cubic-bezier(0.23, 1, 0.32, 1)',
        },
        label: {
          position: 'absolute',
          top: '-22px',
          background: 'rgba(0,0,0,.8)',
          borderRadius: '14px',
          color: '#fff',
          fontSize: '11px',
          padding: '4px 7px 3px',
          fontWeight: 'bold',
          textTransform: 'capitalize',
          left: '50%',
          transform: 'translateX(-50%)',
          transition: '200ms transform cubic-bezier(0.23, 1, 0.32, 1)',
          opacity: '0',
        },
      },
      'hover': {
        icon: {
          transform: 'scale(1.3)',
        },
        label: {
          transform: 'translateX(-50%) translateY(-10px)',
          opacity: '1',
        },
      },
    }, { hover })
  
    const handleClick = () => {
      onSelect && onSelect(label)
    }
  
    return (
      <div style={ styles.wrap }>
        <div style={ styles.label }>{ label }</div>
        <div style={ styles.icon } onClick={ handleClick } />
      </div>
    )
  }
  