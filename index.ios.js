import React, { Component } from 'react';
import {
  AppRegistry,
  AsyncStorage,
  StyleSheet,
  Text,
  Button,
  View,
  Slider,
  Switch,
  SegmentedControlIOS
} from 'react-native';

import { createStore, combineReducers } from 'redux';

import GL from 'gl-react';
import { Surface } from 'gl-react-native';

const shaders = GL.Shaders.create({
  gradientFader: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform vec3 colors[3];
      uniform bool flip[3];
      uniform float alpha;
      void main () {
        vec2 uvFlip = (uv.yx - 1.0) * -1.0;
        vec2 uvRed = flip[0] ? uvFlip : uv;
        vec2 uvGreen = flip[1] ? uvFlip : uv;
        vec2 uvBlue = flip[2] ? uvFlip : uv;
        gl_FragColor = vec4(colors[0].z * (uvRed.x * colors[0].x + uvRed.y * colors[0].y), colors[1].z * (uvGreen.y * colors[1].x + uvGreen.x * colors[1].y), colors[2].z * (uvBlue.x * colors[2].x + uvBlue.y * colors[2].y), alpha);
      }
    `
  }
});

const X = 0, Y = 1, SATURATION = 2;

function updateColors(state = [
    [-0.5, 1.3, 0.5],
    [-0.4, 0.7, 0.4],
    [0.7, 0.9, 0.4]
  ], action) {
  switch (action.type) {
    case 'UPDATE_COLORS':
      let colors = [[...state[0]],[...state[1]],[...state[2]]];
      colors[action.color][action.index] = action.value;
      return colors;
    default:
      return state;
  }
}

function updateFlip(state = [true, false, false], action) {
  let flip;
  switch (action.type) {
    case 'UPDATE_FLIP':
      flip = [...state];
      flip[action.index] = !flip[action.index];
      return flip;
    case 'SET_FLIP':
      flip = [...state];
      flip[action.index] = action.value;
      return flip;
    default:
      return state;
  }
}

function updateAlpha(state = 0.85, action) {
  switch (action.type) {
    case 'UPDATE_ALPHA':
      return action.value;
    default:
      return state;
  }
}

function updateSelectedColor(state = 0, action) {
  switch(action.type) {
    case 'UPDATE_SELECTED_COLOR':
      return action.value;
    default:
      return state;
  }
}

var store = createStore(combineReducers({ colors: updateColors, flip: updateFlip, alpha: updateAlpha, selectedColor: updateSelectedColor }));

class MainEditor extends Component {

  constructor() {
    super();

    this.state = store.getState();

    store.subscribe(() => this.setState(store.getState()));

    AsyncStorage.getItem('shaderInputs').then((saved) => {
      let shaderInputs = JSON.parse(saved || '{}');
      if (shaderInputs.colors && shaderInputs.flip && shaderInputs.alpha !== undefined) {
        //this.setState(shaderInputs);
        shaderInputs.colors.map((val, color) => {
          val.map((value, index) => {
            store.dispatch({ type: 'UPDATE_COLORS', color, index, value });
          });
        });
        shaderInputs.flip.map((value, index) => {
          store.dispatch({ type: 'SET_FLIP', index, value });
        });
        store.dispatch({ type: 'UPDATE_ALPHA', value: shaderInputs.alpha });
      }
    });

  }

  saveInputs() {
    const { colors, flip, alpha } = this.state;
    AsyncStorage.setItem('shaderInputs', JSON.stringify({colors, flip, alpha}));
  }

  render() {
    const { colors, flip, alpha } = this.state;
    return (
      <View>
        <Surface width={300} height={300}>
          <GradientFader colors={colors} flip={flip} alpha={alpha} />
        </Surface>
        <SegmentedControlIOS
          style={styles.segControl}
          values={['Red', 'Green', 'Blue']}
          selectedIndex={this.state.selectedColor}
          onChange={({ nativeEvent: { selectedSegmentIndex: value } }) =>
            store.dispatch({ type: 'UPDATE_SELECTED_COLOR', value })
          }
        />
        <Slider
          value={this.state.colors[this.state.selectedColor][SATURATION]}
          onValueChange={value =>
            store.dispatch({ type: 'UPDATE_COLORS', color: this.state.selectedColor, index: SATURATION, value })
          }
        />
        <Switch
          value={this.state.flip[this.state.selectedColor]}
          onValueChange={() =>
            store.dispatch({ type: 'UPDATE_FLIP', index: this.state.selectedColor})
          }
        />
        <Slider
          minimumValue={-3}
          maximumValue={3}
          value={this.state.colors[this.state.selectedColor][X]}
          onValueChange={value =>
            store.dispatch({ type: 'UPDATE_COLORS', color: this.state.selectedColor, index: X, value })
          }
        />
        <Slider
          minimumValue={-3}
          maximumValue={3}
          value={this.state.colors[this.state.selectedColor][Y]}
          onValueChange={value =>
            store.dispatch({ type: 'UPDATE_COLORS', color: this.state.selectedColor, index: Y, value })
          }
        />
        <Slider
          value={alpha}
          minimumValue={0.7}
          onValueChange={value =>
            store.dispatch({ type: 'UPDATE_ALPHA', value })
          }
        />
        <Button
          title="Save"
          onPress={this.saveInputs.bind(this)}
        />
      </View>
    );
  }
}

const GradientFader = GL.createComponent(
  ({ colors, flip, alpha }) =>
  <GL.Node
    shader={shaders.gradientFader}
    uniforms={{ colors, flip, alpha }}
  />
);

export default class SimpleFun extends Component {
  render() {
    return (
      <View style={styles.container}>
        <MainEditor />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  mono: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  segControl: {
    margin: 15
  }
});

AppRegistry.registerComponent('SimpleFun', () => SimpleFun);
