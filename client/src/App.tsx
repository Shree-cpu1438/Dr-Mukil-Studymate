import { useNotesGenerator } from './hooks/useNotesGenerator';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ErrorBanner from './components/ErrorBanner';
import LoadingSpinner from './components/LoadingSpinner';
import OutputSection from './components/OutputSection';
import Footer from './components/Footer';
import './App.css';

function App() {
  const {
    topic,
    level,
    isLoading,
    notes,
    errorMessage,
    validationError,
    partialError,
    copyButtonLabel,
    clipboardFallback,
    setTopic,
    setLevel,
    generateNotes,
    clearForm,
    copyNotes,
  } = useNotesGenerator();

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <InputForm
          topic={topic}
          level={level}
          isLoading={isLoading}
          validationError={validationError}
          onTopicChange={setTopic}
          onLevelChange={setLevel}
          onGenerate={generateNotes}
          onClear={clearForm}
        />

        {errorMessage && (
          <ErrorBanner message={errorMessage} />
        )}

        {isLoading && <LoadingSpinner />}

        {notes && !isLoading && (
          <OutputSection
            notes={notes}
            partialError={partialError}
            copyButtonLabel={copyButtonLabel}
            clipboardFallback={clipboardFallback}
            onCopy={copyNotes}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
