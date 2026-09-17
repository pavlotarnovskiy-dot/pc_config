import React from 'react';
import PCBuilder from '../components/PCBuilder';
import NavigationBar from '../components/NavigationBar';

const BuildPage = () => {
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
            <NavigationBar breadcrumbs={[
                { label: 'Головна', link: '/' },
                { label: 'КОНСТРУКТОР СИСТЕМИ' }
            ]} />

            {/* Сам конструктор (він тепер буде на темному фоні body) */}
            <PCBuilder />
        </div>
    );
};

export default BuildPage;