import styles from './BlockSkeleton.module.scss';

/**
 * Loading skeleton displayed while lazy-loaded block components are loading
 */
export default function BlockSkeleton() {
  return (
    <div className={styles.blockSkeleton}>
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonContent} />
    </div>
  );
}
