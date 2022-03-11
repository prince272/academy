namespace Academy.Server.Models.Accounts
{
    public class ProfileEditModel
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Bio { get; set; }

        public int? AvatarId { get; set; }
    }
}
