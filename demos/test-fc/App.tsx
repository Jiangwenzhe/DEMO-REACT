import { useState } from 'react';

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return num === 3 ? <span>3333</span> : <div>{num}</div>;
}

export default App;
