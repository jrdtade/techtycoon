import { useState } from 'react';
import { getProductType, getSegment, previewLaunch } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';
import { Modal } from './Modal';

export function LaunchModal({ projectId }: { projectId: string }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = useGame((s) => s.closeModal);
  const project = game.projects.find((p) => p.id === projectId);
  const segment = project ? getSegment(project.segmentId) : null;
  const type = project ? getProductType(project.productTypeId) : null;
  const [name, setName] = useState(project?.name ?? '');
  const [price, setPrice] = useState(project && type ? (type.suggestedPrice[project.segmentId] ?? segment!.referencePrice) : 0);
  const [marketing, setMarketing] = useState(segment?.marketingReference ?? 0);

  if (!project || !segment || !type) return null;
  const preview = previewLaunch(game, projectId, price, marketing);

  const launch = () => {
    if (dispatch({ type: 'launchProduct', projectId, productName: name, price, marketingWeekly: marketing })) close();
  };

  return (
    <Modal
      title={`Launch ${project.name}`}
      onClose={close}
      footer={
        <>
          <button onClick={close}>Not yet</button>
          <button className="primary" onClick={launch}>
            Ship it
          </button>
        </>
      }
    >
      <p className="muted">
        {type.name} for {segment.name}. Waiting keeps the team fixing bugs ({Math.round(project.bugs)} open) but costs salaries and budget.
      </p>
      <div className="form-col">
        <label>
          Product name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <label>
          Price <span className="muted">(segment reference {money(segment.referencePrice)})</span>
          <input type="number" min={1} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label>
          Marketing per week <span className="muted">(you can change this later)</span>
          <input type="number" min={0} step={50} value={marketing} onChange={(e) => setMarketing(Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>
      {preview && (
        <div className="estimate">
          <div>
            Expected review: <strong>{preview.reviewScore.toFixed(1)}/10</strong>{' '}
            <span className="muted">
              (features {Math.round(preview.featureScore * 100)}%, polish {Math.round(preview.polishScore * 100)}%, bug penalty −
              {Math.round(preview.bugPenalty * 100)}%)
            </span>
          </div>
          <div>
            Early sales: ~{preview.weeklyUnits.toFixed(preview.weeklyUnits < 10 ? 2 : 0)} units/wk ·{' '}
            {money(preview.weeklyRevenue)}/wk revenue ·{' '}
            <span className={preview.weeklyProfit < 0 ? 'bad' : 'good'}>{money(preview.weeklyProfit)}/wk after unit costs and marketing</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
