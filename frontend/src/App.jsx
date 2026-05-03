import { Routes, Route } from 'react-router-dom';
import Layout    from './components/Layout';
import Dashboard from './pages/Dashboard';
import Games     from './pages/Games';
import Schedule  from './pages/Schedule';
import Players   from './pages/Players';
import Teams     from './pages/Teams';
import Standings from './pages/Standings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index          element={<Dashboard />} />
        <Route path="games"   element={<Games />} />
        <Route path="schedule"element={<Schedule />} />
        <Route path="players" element={<Players />} />
        <Route path="teams"   element={<Teams />} />
        <Route path="standings" element={<Standings />} />
      </Route>
    </Routes>
  );
}
