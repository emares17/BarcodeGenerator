import Sidebar from './Sidebar';
import LabelUploader from './labelUploader';

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <LabelUploader />
      </main>
    </div>
  );
}

export default Dashboard;
