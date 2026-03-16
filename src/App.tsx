import React from 'react';
import { MentionTextarea } from './ui/Teaxtarea';
import './global.scss';

const App: React.FC = () => (
  <main className="app">
    <div className="container">
      <p className="label">Новое сообщение</p>
      <MentionTextarea />
    </div>
  </main>
);

export default App;
