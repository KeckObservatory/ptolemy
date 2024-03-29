import DropDown from './drop_down'
import { ThemeKeys } from 'react-json-view'
import FormControl from '@mui/material/FormControl'

interface ThemeSelectProps {
  theme: string | ThemeKeys | null | undefined
  setTheme: Function
}

const JsonViewTheme = (props: ThemeSelectProps) => {
  const keyList: ThemeKeys[] = ['apathy', 'apathy:inverted', 'ashes',
    'bespin', 'brewer', 'bright:inverted', 'bright', 'chalk',
    'codeschool', 'colors', 'eighties', 'embers', 'flat',
    'google', 'grayscale', 'grayscale:inverted', 'greenscreen', 'harmonic',
    'hopscotch', 'isotope', 'marrakesh', 'mocha', 'monokai', 'ocean',
    'paraiso', 'pop', 'railscasts', 'rjv-default', 'shapeshifter', 'shapeshifter:inverted',
    'solarized', 'summerfruit', 'summerfruit:inverted', 'threezerotwofour', 'tomorrow',
    'tube', 'twilight']
  return (

    <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
      <DropDown
        placeholder={'json theme'}
        arr={keyList}
        value={props.theme}
        handleChange={props.setTheme}
        label={'JSON Theme'}
      />
    </FormControl>
  )
}

export default JsonViewTheme