namespace Academy.Server.Data.Entities
{
    public class QuestionAnswer : IEntity
    {
        public virtual Question Question { get; set; }

        public int QuestionId { get; set; }

        public int Index { get; set; }

        public int Id { get; set; }

        public string Text { get; set; }

        public bool Checked { get; set; }
    }
}
