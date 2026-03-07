import { ConfigProvider } from './contexts/ConfigContext';
import { I18nProvider } from './contexts/I18nContext';
import { MainLayout } from './MainLayout';
import './index.css';

function App() {
    return (
        <ConfigProvider>
            <I18nProvider>
                <MainLayout />
            </I18nProvider>
        </ConfigProvider>
    );
}

export default App;
