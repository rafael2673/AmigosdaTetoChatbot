import React from 'react';
import './Iframe.css';

export default class Iframe extends React.Component {
  render() {
    return (
      <div>
        <iframe title="ONG Teto" className='iframe' src={this.props.src} />
      </div>
    )
  }
}
