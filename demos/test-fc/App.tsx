import { useState } from 'react';

function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return <button onClick={() => setNum(() => num + 1)}>{num}</button>;
}

export default App;
