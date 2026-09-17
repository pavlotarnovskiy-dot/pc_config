import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar = ({ breadcrumbs }) => {
  return (
    <div style={{
      padding: '20px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '20px',
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', fontSize: '0.9rem' }}>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {crumb.link ? (
              <Link
                to={crumb.link}
                style={{ color: '#888', textDecoration: 'none', transition: 'color 0.3s' }}
                onMouseEnter={(e) => e.target.style.color = '#ccc'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                {crumb.label}
              </Link>
            ) : (
              <strong style={{ color: '#e0e0e0', letterSpacing: '1px' }}>
                {crumb.label}
              </strong>
            )}
            {index < breadcrumbs.length - 1 && (
              <span style={{ margin: '0 10px', color: '#444' }}>/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NavigationBar;
