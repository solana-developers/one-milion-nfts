'use strict';
import React from 'react'
import reactCSS from 'reactcss'
import {  ColorResult, SwatchesPicker } from 'react-color'

interface IProps {
  color: string;
  onChangeComplete: (color: string) => void;
}

class SketchExample extends React.Component<IProps, any>  {

  state = {
    displayColorPicker: false,
    // color: {
    //   r: '241',
    //   g: '112',
    //   b: '19',
    //   a: '1',
    // },
    color: this.props.color || "#000000"
  };

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
  };

  handleChange = (color: ColorResult) => {
    this.setState({ color: color.hex });
  };

  handleComplete = (color: ColorResult) => {
    this.props.onChangeComplete(color.hex);
  };

  render() {
    const styles = reactCSS({
      default: {
        container: {
          height: "46px"
        },
        color: {
          width: "30px",
          height: "18px",
          borderRadius: "2px",
          // background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
          background: `${this.state.color}`
        },
        swatch: {
          padding: "5px",
          background: "#fff",
          borderRadius: "1px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
          display: "inline-block",
          cursor: "pointer",
          transform: "translate(2px, 2px)",
          marginLeft: "4px",
          height: 28
        },
      }
    });

    return (
      <div style={styles.container}>
        <div style={styles.swatch} onClick={this.handleClick}>
          <div style={styles.color} />
        </div>
        {this.state.displayColorPicker ? (
          <div className='absolute'>
            <div className='fixed inset-0' onClick={this.handleClose} />
            <SwatchesPicker
              color={this.state.color}
              onChange={this.handleChange}
              onChangeComplete={this.handleComplete}
            />
          </div>
        ) : null}
      </div>
    )
  }
}

export default SketchExample