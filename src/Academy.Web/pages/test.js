
import { useRef, useState } from 'react';
import PhoneInput from '../components/PhoneInput';



function Example() {
  // `value` will be the parsed phone number in E.164 format.
  // Example: "+12133734253".
  const [value, setValue] = useState("princeowusu.272@gmail.com");
  const ref = useRef();

  return (<div className='p-10'>{value}<button onClick={() => setValue("+233550362337")}>Set</button> <PhoneInput value={value} onChange={setValue} defaultCountry="GH" /></div>)
}

export default Example;