
import React from 'react';

const Message = ({ id, msg, animation, width, username, classNames, onClick, display }) => (
 <div className={`messages p-1 ${classNames}`}
 onClick={() => onClick(id)} 
 style={{ zIndex: id, 
    position: 'relative', 
    display: display,
    animation: animation}}>{`[${username}]: ${msg}`}</div>
);

export default Message; 