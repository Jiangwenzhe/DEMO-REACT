import ReactDom from 'react-dom/client';

import App from './App';

const root = document.querySelector('#root');

ReactDom.createRoot(root).render(<App />);

// console.log("React", React, <App />);
// console.log(ReactDom);
