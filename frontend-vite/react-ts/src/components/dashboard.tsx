import Header from './header'; 
import LabelUploader from './labelUploader';

function Dashboard() {

  return (
    <div className="w-screen min-h-screen bg-white" style={{ fontFamily: 'Inter, Noto Sans, sans-serif' }}>
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <Header />
      </header>
      <LabelUploader /> 
    </div>
  );
}

export default Dashboard;