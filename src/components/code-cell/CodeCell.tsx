import './code-cell.css';
import { useEffect } from 'react';
import CodeEditor from '../code-editor/CodeEditor';
import Preview from '../preview/Preview';
import Resizable from '../resizable/Resizable';
import { Cell } from '../../redux';
import { useActions } from '../../hooks/useActions';
import { useTypedSelector } from '../../hooks/useTypedSelector';
interface CodeCellProps {
  cell: Cell;
}

const CodeCell: React.FC<CodeCellProps> = ({ cell }) => {
  const { updateCell, createBundle } = useActions();
  const bundle = useTypedSelector((state) => state.bundles[cell.id]);

  const cumulativeCode = useTypedSelector((state) => {
    const { data, order } = state.cells;
    const orderedCells = order.map((id) => data[id]);

    //Add a show function to conveniently render on the Preview
    const cumulativeCode = [
      `
        const show = (value) => {
          if(typeof value === 'object') {
            if(value.$$typeof && value.props) {
              ReactDOM.render(value, document.querySelector('#root))
            } else {
              document.querySelector('#root).innerHTML = JSON.stringify(value);
            }
          } else {
            document.querySelector('#root).innerHTML = value;
          }
        }
      `,
    ];
    for (let c of orderedCells) {
      if (c.type === 'code') {
        cumulativeCode.push(c.content);
      }
      if (c.id === cell.id) {
        break;
      }
    }
    return cumulativeCode;
  });

  useEffect(() => {
    if (!bundle) {
      createBundle(cell.id, cumulativeCode.join('\n'));
      return;
    }

    const timer = setTimeout(async () => {
      createBundle(cell.id, cumulativeCode.join('\n'));
    }, 750);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cumulativeCode.join('\n'), cell.id, createBundle]);

  return (
    <Resizable direction='vertical'>
      <div
        style={{
          height: 'calc(100% - 10px)',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Resizable direction='horizontal'>
          <CodeEditor
            initialValue={cell.content}
            onChange={(value) => updateCell(cell.id, value)}
          />
        </Resizable>
        <div className='progress-wrapper'>
          {!bundle || bundle.loading ? (
            <div className='progress-cover'>
              <progress className='progress is-small is-primary' max='100'>
                Loading
              </progress>
            </div>
          ) : (
            <Preview code={bundle.code} err={bundle.err} />
          )}{' '}
        </div>
      </div>
    </Resizable>
  );
};
export default CodeCell;
