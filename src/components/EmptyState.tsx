interface EmptyStateProps {
  image: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ image, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <img src={image} alt="" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}
