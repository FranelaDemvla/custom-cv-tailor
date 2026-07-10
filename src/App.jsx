import Header from './components/Header'
import InputPanel from './components/InputPanel'
import PreviewPanel from './components/PreviewPanel'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <InputPanel />
        </div>
        <div className="flex-1 min-w-0">
          <PreviewPanel />
        </div>
      </main>
    </div>
  )
}

export default App
